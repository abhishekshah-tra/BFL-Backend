import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Configuration,
  ConfigurationDocument,
  ResourceType,
} from '../../schemas/configuration.schema.js';
import { Process, ProcessDocument } from '../../schemas/process.schema.js';
import {
  Warehouse,
  WarehouseDocument,
} from '../../schemas/warehouse.schema.js';
import {
  ControlTowerBottleneck,
  ControlTowerChart,
  ControlTowerDashboard,
  ControlTowerPayload,
  ControlTowerTimeframe,
  ControlTowerWarehouseMetrics,
} from './controltower.types.js';
import { ControltowerQueryDto } from './dto/controltower-query.dto.js';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const BUSINESS_TIME_ZONE = 'Asia/Dubai';
const OPERATING_HOURS = 12;
const DAY_PROFILE = [
  0.04, 0.05, 0.06, 0.08, 0.1, 0.11, 0.12, 0.11, 0.1, 0.09, 0.08, 0.06,
];
const CHART = { x0: 45, x1: 400, yMin: 20, yMax: 140 };

type StaffingMode = 'available' | 'planned' | 'blend';

type MasterProcess = {
  id: string;
  code: string;
  name: string;
  sequence: number;
  capacityPerHour: number;
  sla: number;
  slaUnit: string;
};

type RuntimeResource = {
  resourceType: string;
  processId: string;
  plannedQuantity: number;
  availableQuantity: number;
  productivity: number;
};

type RuntimeProcess = {
  code: string;
  name: string;
  sequence: number;
  capacityPerHour: number;
  sla: number;
  slaUnit: string;
  effectivePerHour: number;
  loadPct: number;
  resources: RuntimeResource[];
  bottleneckLabel: string;
};

type RuntimeWarehouse = {
  code: string;
  name: string;
  throughput: number;
  capacity: number;
  sla: number;
  bottleneck: string;
  status: string;
  statusClass: string;
  barClass: string;
  people: number;
  robots: number;
  robotsOffline: number;
  alerts: string[];
  processes: RuntimeProcess[];
};

type DashboardContext = {
  date: string;
  warehouses: number;
  processes: number;
  configurations: number;
  masters: MasterProcess[];
  warehouseConfigs: Array<{
    warehouse: {
      code: string;
      name: string;
    };
    processes: Array<{
      process: MasterProcess;
      enabled: boolean;
      capacityPerHour: number;
      sla: number;
      slaUnit: string;
    }>;
    resources: RuntimeResource[];
  }>;
};

@Injectable()
export class ControltowerService {
  constructor(
    @InjectModel(Warehouse.name)
    private readonly warehouseModel: Model<WarehouseDocument>,
    @InjectModel(Process.name)
    private readonly processModel: Model<ProcessDocument>,
    @InjectModel(Configuration.name)
    private readonly configurationModel: Model<ConfigurationDocument>,
  ) {}

  async getDashboard(query: ControltowerQueryDto) {
    const date = this.resolveDate(query.date);
    const context = await this.loadContext(date);

    const today = this.buildSlice(
      context,
      ControlTowerTimeframe.TODAY,
      'available',
    );
    const yesterday = this.buildSlice(
      context,
      ControlTowerTimeframe.YESTERDAY,
      'planned',
    );
    const last7 = this.buildSlice(
      context,
      ControlTowerTimeframe.LAST7,
      'blend',
    );

    this.applyTrends(today, yesterday, 'Yesterday');
    this.applyTrends(yesterday, last7, '7-day average', 7);
    this.applyTrends(last7, yesterday, 'Prior Week', 1, 7);

    if (query.timeframe === ControlTowerTimeframe.TODAY) return today;
    if (query.timeframe === ControlTowerTimeframe.YESTERDAY) return yesterday;
    if (query.timeframe === ControlTowerTimeframe.LAST7) return last7;

    const dashboard: ControlTowerDashboard = {
      date,
      source: {
        warehouses: context.warehouses,
        processes: context.processes,
        configurations: context.configurations,
      },
      today,
      yesterday,
      last7,
    };

    return dashboard;
  }

  async listDates() {
    const today = this.todayIso();

    return {
      dates: Array.from({ length: 7 }, (_, index) =>
        this.addDays(today, -index),
      ),
    };
  }

  private async loadContext(date: string): Promise<DashboardContext> {
    const asOf = new Date(`${date}T23:59:59.999Z`);

    const [warehouses, processes, configurations] = await Promise.all([
      this.warehouseModel.find({ isActive: true }).sort({ code: 1 }).lean(),
      this.processModel.find({ isActive: true }).sort({ sequence: 1 }).lean(),
      this.configurationModel
        .find({
          isActive: true,
          effectiveFrom: { $lte: asOf },
        })
        .sort({ effectiveFrom: -1 })
        .lean(),
    ]);

    if (!warehouses.length) {
      throw new NotFoundException('No active warehouses found');
    }

    if (!processes.length) {
      throw new NotFoundException('No active processes found');
    }

    const processMap = new Map(
      processes.map((process) => [
        String(process._id),
        {
          id: String(process._id),
          code: process.code,
          name: process.name,
          sequence: process.sequence,
          capacityPerHour: process.capacityPerHour,
          sla: process.sla,
          slaUnit: process.slaUnit,
        } satisfies MasterProcess,
      ]),
    );

    const configByWarehouse = new Map<string, (typeof configurations)[number]>();

    for (const config of configurations) {
      const warehouseId = String(config.warehouseId);

      if (!configByWarehouse.has(warehouseId)) {
        configByWarehouse.set(warehouseId, config);
      }
    }

    const warehouseConfigs = warehouses.map((warehouse) => {
      const config = configByWarehouse.get(String(warehouse._id));
      const resources: RuntimeResource[] = (config?.resources || [])
        .filter((resource) => resource.isActive !== false)
        .map((resource) => ({
          resourceType: resource.resourceType,
          processId: String(resource.processId),
          plannedQuantity: resource.plannedQuantity,
          availableQuantity: resource.availableQuantity,
          productivity: resource.productivity,
        }));

      const configuredProcesses = (config?.processes || [])
        .filter((item) => item.enabled !== false)
        .map((item) => {
          const process = processMap.get(String(item.processId));

          if (!process) return null;

          return {
            process,
            enabled: true,
            capacityPerHour: item.capacityPerHour,
            sla: item.sla,
            slaUnit: item.slaUnit,
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item));

      const fallbackProcesses =
        configuredProcesses.length > 0
          ? configuredProcesses
          : [...processMap.values()].map((process) => ({
              process,
              enabled: true,
              capacityPerHour: process.capacityPerHour,
              sla: process.sla,
              slaUnit: process.slaUnit,
            }));

      return {
        warehouse: {
          code: warehouse.code,
          name: warehouse.name,
        },
        processes: fallbackProcesses,
        resources,
      };
    });

    return {
      date,
      warehouses: warehouses.length,
      processes: processes.length,
      configurations: configByWarehouse.size,
      masters: [...processMap.values()],
      warehouseConfigs,
    };
  }

  private buildSlice(
    context: DashboardContext,
    timeframe: ControlTowerTimeframe,
    staffing: StaffingMode,
  ): ControlTowerPayload {
    const dayCount = timeframe === ControlTowerTimeframe.LAST7 ? 7 : 1;
    const hours = OPERATING_HOURS * dayCount;

    const warehouses = context.warehouseConfigs.map((item) =>
      this.buildWarehouse(item, staffing, hours),
    );

    const warehouseMap = Object.fromEntries(
      warehouses.map((warehouse) => [
        warehouse.code,
        this.toWarehouseMetrics(warehouse),
      ]),
    );

    const networkThroughput = warehouses.reduce(
      (sum, warehouse) => sum + warehouse.throughput,
      0,
    );
    const networkCapacity = this.average(
      warehouses.map((warehouse) => warehouse.capacity),
    );
    const networkSla = this.average(
      warehouses.map((warehouse) => warehouse.sla),
    );
    const bottleneckRows = this.networkBottlenecks(warehouses, timeframe);
    const alerts = warehouses.flatMap((warehouse) => warehouse.alerts);
    const people = warehouses.reduce(
      (sum, warehouse) => sum + warehouse.people,
      0,
    );
    const robots = warehouses.reduce(
      (sum, warehouse) => sum + warehouse.robots,
      0,
    );
    const robotsOffline = warehouses.reduce(
      (sum, warehouse) => sum + warehouse.robotsOffline,
      0,
    );

    const unit =
      timeframe === ControlTowerTimeframe.LAST7
        ? 'Units / Week'
        : 'Units / Day';
    const periodLabel = this.periodLabel(timeframe);
    const warehouseBreakdown = warehouses
      .map(
        (warehouse) =>
          `${warehouse.code}: ${this.formatNumber(warehouse.throughput)}`,
      )
      .join(' | ');

    return {
      kpis: {
        throughput: {
          value: this.formatNumber(networkThroughput),
          unit,
          detail: `Total Throughput: ${this.formatNumber(networkThroughput)} units ${periodLabel} across ${warehouses.length} warehouses. ${warehouseBreakdown}`,
        },
        capacity: {
          value: `${networkCapacity}%`,
          detail: `Capacity Utilization: ${networkCapacity}% network-wide from warehouse configuration load vs resource capacity.`,
        },
        sla: {
          value: `${networkSla}%`,
          detail: `SLA Achievement: ${networkSla}% overall, based on bottleneck process staffing vs configured capacity.`,
        },
        bottlenecks: {
          value: String(bottleneckRows.length),
          detail: bottleneckRows.length
            ? `${bottleneckRows.length} active bottlenecks: ${bottleneckRows.map((item) => item.name).join(', ')}.`
            : 'No active bottlenecks from current warehouse configurations.',
        },
        alerts: {
          value: String(alerts.length),
          detail: alerts.length
            ? `${alerts.length} open alerts: ${alerts.join(', ')}.`
            : 'No open alerts from resource gaps or high process load.',
        },
      },
      warehouses: warehouseMap,
      bottlenecks: bottleneckRows,
      chart: this.buildChart(warehouses, timeframe, context.date),
      recommendation: this.buildRecommendation(
        timeframe,
        warehouses,
        people,
        robots,
        robotsOffline,
        alerts.length,
      ),
    };
  }

  private buildWarehouse(
    item: DashboardContext['warehouseConfigs'][number],
    staffing: StaffingMode,
    hours: number,
  ): RuntimeWarehouse {
    const processes = item.processes
      .map((processItem) => {
        const resources = item.resources.filter(
          (resource) => resource.processId === processItem.process.id,
        );
        const resourceHourly = resources.reduce(
          (sum, resource) =>
            sum + this.staffedQuantity(resource, staffing) * resource.productivity,
          0,
        );
        const effectivePerHour =
          resources.length > 0
            ? Math.min(processItem.capacityPerHour, resourceHourly)
            : processItem.capacityPerHour;
        const loadPct =
          resources.length > 0
            ? Math.round(
                (processItem.capacityPerHour / Math.max(resourceHourly, 0.0001)) *
                  100,
              )
            : 0;

        return {
          code: processItem.process.code,
          name: processItem.process.name,
          sequence: processItem.process.sequence,
          capacityPerHour: processItem.capacityPerHour,
          sla: processItem.sla,
          slaUnit: processItem.slaUnit,
          effectivePerHour,
          loadPct,
          resources,
          bottleneckLabel: this.bottleneckLabel(
            processItem.process.name,
            resources,
            staffing,
          ),
        } satisfies RuntimeProcess;
      })
      .sort((left, right) => left.sequence - right.sequence);

    const bottleneckProcess = [...processes].sort(
      (left, right) =>
        right.loadPct - left.loadPct ||
        left.effectivePerHour - right.effectivePerHour,
    )[0];
    const hourlyThroughput = processes.length
      ? Math.min(...processes.map((process) => process.effectivePerHour))
      : 0;
    const capacity = Math.min(100, bottleneckProcess?.loadPct || 0);
    const sla = bottleneckProcess
      ? this.clamp(
          Math.round(
            (bottleneckProcess.effectivePerHour /
              Math.max(bottleneckProcess.capacityPerHour, 1)) *
              100,
          ),
          0,
          100,
        )
      : 0;
    const status = this.statusFrom(capacity, sla);
    const people = this.sumResource(
      item.resources,
      ResourceType.OPERATOR,
      staffing,
    );
    const robots = this.sumResource(
      item.resources,
      ResourceType.ROBOT,
      staffing,
    );
    const robotsPlanned = item.resources
      .filter((resource) => resource.resourceType === ResourceType.ROBOT)
      .reduce((sum, resource) => sum + resource.plannedQuantity, 0);

    return {
      code: item.warehouse.code,
      name: item.warehouse.name,
      throughput: Math.round(hourlyThroughput * hours),
      capacity,
      sla,
      bottleneck: bottleneckProcess?.bottleneckLabel || 'None',
      status: status.label,
      statusClass: status.statusClass,
      barClass: status.barClass,
      people: Math.round(people),
      robots: Math.round(robots),
      robotsOffline: Math.max(robotsPlanned - Math.round(robots), 0),
      alerts: this.warehouseAlerts(item.warehouse.code, processes, item.resources),
      processes,
    };
  }

  private toWarehouseMetrics(
    warehouse: RuntimeWarehouse,
  ): ControlTowerWarehouseMetrics {
    return {
      throughput: this.formatNumber(warehouse.throughput),
      capacity: warehouse.capacity,
      barClass: warehouse.barClass,
      sla: `${warehouse.sla}%`,
      bottleneck: warehouse.bottleneck,
      status: warehouse.status,
      statusClass: warehouse.statusClass,
    };
  }

  private networkBottlenecks(
    warehouses: RuntimeWarehouse[],
    timeframe: ControlTowerTimeframe,
  ): ControlTowerBottleneck[] {
    const suffix = timeframe === ControlTowerTimeframe.LAST7 ? ' avg' : ' ↑';

    return warehouses
      .flatMap((warehouse) =>
        warehouse.processes.map((process) => ({
          name: `${process.bottleneckLabel} – ${warehouse.code}`,
          loadPct: process.loadPct,
        })),
      )
      .filter((item) => item.loadPct >= 80)
      .sort((left, right) => right.loadPct - left.loadPct)
      .slice(0, 3)
      .map((item) => ({
        name: item.name,
        pct: `${Math.min(item.loadPct, 100)}%${suffix}`,
        color:
          item.loadPct >= 90
            ? '#dc2626'
            : item.loadPct >= 80
              ? '#d97706'
              : '#059669',
      }));
  }

  private buildChart(
    warehouses: RuntimeWarehouse[],
    timeframe: ControlTowerTimeframe,
    date: string,
  ): ControlTowerChart {
    const isWeek = timeframe === ControlTowerTimeframe.LAST7;
    const xLabels = isWeek
      ? Array.from({ length: 7 }, (_, index) =>
          this.weekdayLabel(this.addDays(date, -6 + index)),
        )
      : ['12 AM', '4 AM', '8 AM', '12 PM', '4 PM', '8 PM'];
    const valuesByWarehouse = Object.fromEntries(
      warehouses.map((warehouse) => {
        const daily = isWeek
          ? warehouse.throughput / 7
          : warehouse.throughput;
        const points = isWeek
          ? Array.from({ length: 7 }, () => daily)
          : DAY_PROFILE.map((share) => daily * share * DAY_PROFILE.length);

        return [warehouse.code, points];
      }),
    );
    const peak = Math.max(
      ...Object.values(valuesByWarehouse).flat(),
      1,
    );
    const series = Object.fromEntries(
      Object.entries(valuesByWarehouse).map(([code, points]) => [
        code,
        this.toPolyline(points, peak),
      ]),
    );

    return {
      series,
      xLabels,
      ...Object.fromEntries(
        Object.entries(series).map(([code, points]) => [
          code.toLowerCase(),
          points,
        ]),
      ),
    };
  }

  private buildRecommendation(
    timeframe: ControlTowerTimeframe,
    warehouses: RuntimeWarehouse[],
    people: number,
    robots: number,
    robotsOffline: number,
    alerts: number,
  ) {
    const worst = [...warehouses].sort(
      (left, right) => right.capacity - left.capacity,
    )[0];
    const operatorGap = warehouses.reduce((sum, warehouse) => {
      const planned = warehouse.processes
        .flatMap((process) => process.resources)
        .filter((resource) => resource.resourceType === ResourceType.OPERATOR)
        .reduce((total, resource) => total + resource.plannedQuantity, 0);

      return sum + Math.max(planned - warehouse.people, 0);
    }, 0);
    const robotGap = robotsOffline;
    const scenario =
      operatorGap > 0 && robotGap > 0
        ? 'Scenario 2'
        : robotGap > 0
          ? 'Scenario 1'
          : operatorGap > 0
            ? 'Scenario 3'
            : 'Current Plan';
    const lift = worst
      ? this.clamp(Math.round((worst.capacity - 70) * 0.6), 3, 25)
      : 0;
    const waitDrop = this.clamp(Math.round(lift * 1.3), 5, 30);
    const slaLift = this.clamp(Math.round(lift / 4), 1, 8);
    const title =
      timeframe === ControlTowerTimeframe.TODAY
        ? "Today's Recommendation"
        : timeframe === ControlTowerTimeframe.YESTERDAY
          ? "Yesterday's Recommendation"
          : 'Weekly Recommendation';
    const text =
      operatorGap === 0 && robotGap === 0
        ? `Current <strong>${worst?.code || 'network'}</strong> staffing matches planned resources. Keep the current mix to hold throughput and SLA.`
        : `Hybrid model with <strong>+${robotGap} Robots</strong> and <strong>+${operatorGap} Operators</strong> in ${worst?.code || 'the network'} will increase throughput by <strong>${lift}%</strong>, reduce <strong>waiting time</strong> by <strong>${waitDrop}%</strong> and improve <strong>SLA</strong> by <strong>${slaLift}%</strong>.`;

    return {
      title,
      scenario,
      text,
      people,
      robots,
      alerts,
      simulations: 0,
      peopleDetail: `${people} people across all warehouses: ${warehouses
        .map((warehouse) => `${warehouse.code} ${warehouse.people}`)
        .join(', ')}`,
      robotsDetail: `${robots} robots total: ${warehouses
        .map((warehouse) => `${warehouse.code} ${warehouse.robots}`)
        .join(', ')}${robotsOffline ? ` (${robotsOffline} offline vs plan)` : ''}`,
      simsDetail:
        'No simulation runs are stored in warehouse, process, or configuration masters.',
    };
  }

  private applyTrends(
    current: ControlTowerPayload,
    baseline: ControlTowerPayload,
    suffix: string,
    baselineDays = 1,
    currentDays = 1,
  ) {
    const currentThroughput = this.parseNumber(current.kpis.throughput.value);
    const baselineThroughput =
      (this.parseNumber(baseline.kpis.throughput.value) / baselineDays) *
      currentDays;
    const throughputTrend = this.percentTrend(
      currentThroughput,
      baselineThroughput,
      suffix,
    );
    current.kpis.throughput.trend = throughputTrend.trend;
    current.kpis.throughput.trendClass = throughputTrend.trendClass;

    const capacityTrend = this.pointTrend(
      this.parsePercent(current.kpis.capacity.value),
      this.parsePercent(baseline.kpis.capacity.value),
      suffix,
    );
    current.kpis.capacity.trend = capacityTrend.trend;
    current.kpis.capacity.trendClass = capacityTrend.trendClass;

    const slaTrend = this.pointTrend(
      this.parsePercent(current.kpis.sla.value),
      this.parsePercent(baseline.kpis.sla.value),
      suffix,
    );
    current.kpis.sla.trend = slaTrend.trend;
    current.kpis.sla.trendClass = slaTrend.trendClass;

    const bottleneckTrend = this.countTrend(
      Number(current.kpis.bottlenecks.value),
      Number(baseline.kpis.bottlenecks.value),
      suffix,
    );
    current.kpis.bottlenecks.trend = bottleneckTrend.trend;
    current.kpis.bottlenecks.trendClass = bottleneckTrend.trendClass;
  }

  private warehouseAlerts(
    warehouseCode: string,
    processes: RuntimeProcess[],
    resources: RuntimeResource[],
  ) {
    const alerts: string[] = [];

    for (const process of processes) {
      if (process.loadPct >= 90) {
        alerts.push(
          `Critical (${warehouseCode}) ${process.bottleneckLabel} at ${Math.min(process.loadPct, 100)}% load`,
        );
      } else if (process.loadPct >= 80) {
        alerts.push(
          `Warning (${warehouseCode}) ${process.bottleneckLabel} at ${process.loadPct}% load`,
        );
      }
    }

    for (const resource of resources) {
      const gap = resource.plannedQuantity - resource.availableQuantity;

      if (gap > 0) {
        alerts.push(
          `Info (${warehouseCode}) ${gap} ${resource.resourceType.toLowerCase()}(s) below plan`,
        );
      }
    }

    return alerts;
  }

  private bottleneckLabel(
    processName: string,
    resources: RuntimeResource[],
    staffing: StaffingMode,
  ) {
    if (!resources.length) {
      return processName;
    }

    const tightest = [...resources].sort((left, right) => {
      const leftRatio =
        this.staffedQuantity(left, staffing) /
        Math.max(left.plannedQuantity, 1);
      const rightRatio =
        this.staffedQuantity(right, staffing) /
        Math.max(right.plannedQuantity, 1);

      return leftRatio - rightRatio;
    })[0];

    if (tightest?.resourceType === ResourceType.ROBOT) {
      return `Robo ${processName}`;
    }

    return processName;
  }

  private staffedQuantity(resource: RuntimeResource, staffing: StaffingMode) {
    if (staffing === 'planned') {
      return resource.plannedQuantity;
    }

    if (staffing === 'available') {
      return resource.availableQuantity;
    }

    return (resource.plannedQuantity + resource.availableQuantity) / 2;
  }

  private sumResource(
    resources: RuntimeResource[],
    type: ResourceType,
    staffing: StaffingMode,
  ) {
    return resources
      .filter((resource) => resource.resourceType === type)
      .reduce(
        (sum, resource) => sum + this.staffedQuantity(resource, staffing),
        0,
      );
  }

  private statusFrom(capacity: number, sla: number) {
    if (capacity >= 90 || sla < 85) {
      return {
        label: 'Critical',
        statusClass: 'critical',
        barClass: 'red',
      };
    }

    if (capacity >= 80 || sla < 92) {
      return {
        label: 'At Risk',
        statusClass: 'at-risk',
        barClass: 'orange',
      };
    }

    return {
      label: 'Good',
      statusClass: 'good',
      barClass: 'green',
    };
  }

  private toPolyline(values: number[], peak: number) {
    if (!values.length) {
      return '';
    }

    return values
      .map((value, index) => {
        const x =
          CHART.x0 +
          (index / Math.max(values.length - 1, 1)) * (CHART.x1 - CHART.x0);
        const y =
          CHART.yMax -
          (value / peak) * (CHART.yMax - CHART.yMin);

        return `${Math.round(x)},${Math.round(y)}`;
      })
      .join(' ');
  }

  private percentTrend(current: number, previous: number, suffix: string) {
    if (!previous) {
      return { trend: `→ No ${suffix} baseline`, trendClass: 'orange' };
    }

    const pct = ((current - previous) / previous) * 100;

    if (Math.abs(pct) < 0.05) {
      return { trend: `→ Same as ${suffix}`, trendClass: 'orange' };
    }

    if (pct > 0) {
      return {
        trend: `↑ ${Math.abs(pct).toFixed(1)}% vs ${suffix}`,
        trendClass: 'up',
      };
    }

    return {
      trend: `↓ ${Math.abs(pct).toFixed(1)}% vs ${suffix}`,
      trendClass: 'down',
    };
  }

  private pointTrend(current: number, previous: number, suffix: string) {
    const delta = Math.round(current - previous);

    if (delta === 0) {
      return { trend: `→ Same as ${suffix}`, trendClass: 'orange' };
    }

    if (delta > 0) {
      return { trend: `↑ ${delta}% vs ${suffix}`, trendClass: 'up' };
    }

    return { trend: `↓ ${Math.abs(delta)}% vs ${suffix}`, trendClass: 'down' };
  }

  private countTrend(current: number, previous: number, suffix: string) {
    const delta = current - previous;

    if (delta === 0) {
      return { trend: `→ Same as ${suffix}`, trendClass: 'orange' };
    }

    if (delta > 0) {
      return { trend: `↑ ${delta} vs ${suffix}`, trendClass: 'orange' };
    }

    return { trend: `↓ ${Math.abs(delta)} vs ${suffix}`, trendClass: 'orange' };
  }

  private periodLabel(timeframe: ControlTowerTimeframe) {
    if (timeframe === ControlTowerTimeframe.TODAY) return 'today';
    if (timeframe === ControlTowerTimeframe.YESTERDAY) return 'yesterday';
    return 'over the last 7 days';
  }

  private resolveDate(date?: string) {
    if (!date) {
      return this.todayIso();
    }

    this.assertDate(date, 'date');
    return date;
  }

  private todayIso() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: BUSINESS_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }

  private addDays(date: string, days: number) {
    const next = new Date(`${date}T00:00:00.000Z`);
    next.setUTCDate(next.getUTCDate() + days);
    return next.toISOString().slice(0, 10);
  }

  private weekdayLabel(date: string) {
    const day = new Date(`${date}T00:00:00.000Z`).getUTCDay();
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day];
  }

  private formatNumber(value: number) {
    return Math.round(value).toLocaleString('en-US');
  }

  private parseNumber(value: string) {
    return Number(value.replace(/,/g, '')) || 0;
  }

  private parsePercent(value: string) {
    return Number(value.replace('%', '')) || 0;
  }

  private average(values: number[]) {
    if (!values.length) return 0;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }

  private clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
  }

  private assertDate(value: string, label: string) {
    if (
      !DATE_PATTERN.test(value) ||
      Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))
    ) {
      throw new BadRequestException(`Invalid ${label}. Use YYYY-MM-DD`);
    }
  }
}
