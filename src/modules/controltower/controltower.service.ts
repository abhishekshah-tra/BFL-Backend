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
const ARRIVAL_SHAPE = [
  1080, 1200, 1320, 1440, 1500, 1500, 1380, 1260, 1140, 1080,
  1020, 1140, 1260, 1380, 1320, 1200, 1080, 960, 840, 720,
];
const TREND_OFFSETS = [
  { volumePct: -8, productivityPct: 1 },
  { volumePct: 4, productivityPct: -1 },
  { volumePct: -2, productivityPct: 0 },
  { volumePct: 10, productivityPct: -2 },
  { volumePct: 6, productivityPct: 0 },
  { volumePct: 14, productivityPct: -3 },
  { volumePct: 0, productivityPct: 0 },
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

  async getOperations(query: ControltowerQueryDto) {
    const date = this.resolveDate(query.date);
    const context = await this.loadContext(date);
    const todayRuntime = this.runtimeList(context, 'available', OPERATING_HOURS);
    const yesterdayRuntime = this.runtimeList(context, 'planned', OPERATING_HOURS);
    const last7Runtime = this.runtimeList(context, 'blend', OPERATING_HOURS);

    return {
      date,
      source: {
        warehouses: context.warehouses,
        processes: context.processes,
        configurations: context.configurations,
      },
      warehouses: todayRuntime.map((warehouse) => ({
        code: warehouse.code,
        name: warehouse.name,
        processes: warehouse.processes.map((process) => ({
          key: process.name,
          label: this.processLabel(process),
        })),
      })),
      today: this.toOpsMap(
        todayRuntime,
        yesterdayRuntime,
        'Yesterday',
        'available',
        ControlTowerTimeframe.TODAY,
      ),
      yesterday: this.toOpsMap(
        yesterdayRuntime,
        last7Runtime,
        'Prior Day',
        'planned',
        ControlTowerTimeframe.YESTERDAY,
      ),
      last7: this.toOpsMap(
        last7Runtime,
        yesterdayRuntime,
        'Prior Week',
        'blend',
        ControlTowerTimeframe.LAST7,
      ),
    };
  }

  async getProcessDetails(query: ControltowerQueryDto) {
    const date = this.resolveDate(query.date);
    const context = await this.loadContext(date);
    const todayRuntime = this.runtimeList(context, 'available', OPERATING_HOURS);
    const yesterdayRuntime = this.runtimeList(context, 'planned', OPERATING_HOURS);
    const last7Runtime = this.runtimeList(context, 'blend', OPERATING_HOURS);

    return {
      date,
      source: {
        warehouses: context.warehouses,
        processes: context.processes,
        configurations: context.configurations,
      },
      warehouses: todayRuntime.map((warehouse) => ({
        code: warehouse.code,
        name: warehouse.name,
        processes: warehouse.processes.map((process) => ({
          key: process.name,
          label: this.processLabel(process),
        })),
      })),
      today: this.toProcessMap(todayRuntime, 'available'),
      yesterday: this.toProcessMap(yesterdayRuntime, 'planned'),
      last7: this.toProcessMap(last7Runtime, 'blend'),
    };
  }

  async getSimulation(query: ControltowerQueryDto) {
    const date = this.resolveDate(query.date);
    const context = await this.loadContext(date);
    const runtime = this.runtimeList(context, 'available', OPERATING_HOURS);

    return {
      date,
      source: {
        warehouses: context.warehouses,
        processes: context.processes,
        configurations: context.configurations,
      },
      warehouses: runtime.map((warehouse) => ({
        code: warehouse.code,
        name: warehouse.name,
      })),
      models: Object.fromEntries(
        runtime.map((warehouse) => [
          warehouse.code,
          this.toSimulationModel(warehouse, date),
        ]),
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

  private toSimulationModel(warehouse: RuntimeWarehouse, date: string) {
    const processes = warehouse.processes.map((process) =>
      this.toSimulationProcess(process),
    );
    const focus =
      processes.find((process) => /sort/i.test(process.name) && process.robots + process.robotPlanned > 0) ||
      processes.find((process) => process.robots + process.robotPlanned > 0) ||
      processes[0];
    const inbound = processes[0];
    const outbound = processes[processes.length - 1];
    const marked = processes.map((process) => ({
      ...process,
      usesScenarioOperators: process.id === focus?.id && process.operatorPlanned + process.operators > 0,
      usesScenarioRobots: process.id === focus?.id && process.robotPlanned + process.robots > 0,
      usesScenarioChutes: process.id === focus?.id && process.chutePlanned + process.chutes > 0,
    }));
    const current = {
      volumePct: 0,
      operators: focus?.operators || 0,
      robots: focus?.robots || 0,
      chutes: focus?.chutes || 0,
      productivityPct: 0,
    };
    const full = {
      operators: Math.max(focus?.operatorPlanned || 0, current.operators),
      robots: Math.max(focus?.robotPlanned || 0, current.robots),
      chutes: Math.max(focus?.chutePlanned || 0, current.chutes),
    };
    const resourceLimits = {
      operators: { min: 0, max: Math.max(full.operators + 2, 1), configured: Math.max(full.operators, 1) },
      robots: { min: 0, max: Math.max(full.robots, 0), configured: Math.max(full.robots, 0) },
      chutes: { min: 0, max: Math.max(full.chutes + 4, 1), configured: Math.max(full.chutes, 1) },
      volumePct: { min: -40, max: 80 },
      productivityPct: { min: -20, max: 30 },
    };
    const robotGap = Math.max(full.robots - current.robots, 0);
    const operatorGap = Math.max(full.operators - current.operators, 0);
    const missing = [
      robotGap === 1 ? '1 missing robot' : robotGap > 1 ? `${robotGap} missing robots` : '',
      operatorGap === 1 ? '1 missing operator' : operatorGap > 1 ? `${operatorGap} missing operators` : '',
    ].filter(Boolean);
    const focusName = focus?.name || 'the main station';
    const shapeSum = ARRIVAL_SHAPE.reduce((sum, value) => sum + value, 0);
    const hourly = Math.max(inbound?.baseCapacityPerHour || focus?.baseCapacityPerHour || 1000, 1);
    const arrivals = ARRIVAL_SHAPE.map((value) =>
      Math.max(1, Math.round((value / shapeSum) * hourly * 10)),
    );
    const templates = [
      {
        id: 'baseline',
        name: 'Baseline (Current)',
        shortName: 'Baseline',
        columnLabel: 'Baseline',
        columnHint: '(Current)',
        description: `Today’s real ${focusName} roster at ${warehouse.name}.`,
        params: { ...current },
      },
      {
        id: 'volume-surge',
        name: 'Scenario 1 — Volume +30%',
        shortName: '+30% Volume',
        columnLabel: 'Scenario 1',
        columnHint: 'Volume +30%',
        description: 'Same people and machines. Only the morning rush is busier.',
        params: { ...current, volumePct: 30 },
      },
      {
        id: 'resource-opt',
        name: 'Scenario 2 — Resources Optimized',
        shortName: 'Resource Opt',
        columnLabel: 'Scenario 2',
        columnHint: 'Resources Optimized',
        description: 'Fill the roster up to the planned robots and operators.',
        params: { ...current, operators: full.operators, robots: full.robots, chutes: full.chutes },
      },
      {
        id: 'hybrid',
        name: 'Scenario 3 — Hybrid Model',
        shortName: 'Hybrid',
        columnLabel: 'Scenario 3',
        columnHint: 'Hybrid Model',
        description: 'Full roster, a few extra chutes, and a small speed-up.',
        params: {
          volumePct: 0,
          operators: Math.min(full.operators + 2, resourceLimits.operators.max),
          robots: full.robots,
          chutes: Math.min(full.chutes + 4, resourceLimits.chutes.max),
          productivityPct: 5,
        },
      },
    ];

    return {
      live: true,
      warehouse: { code: warehouse.code, name: warehouse.name },
      date: { id: date, label: this.prettyDate(date) },
      bucketMinutes: 30,
      bucketCount: ARRIVAL_SHAPE.length,
      dayStartMinutes: 8 * 60,
      focusProcessId: focus?.id || marked[0]?.id,
      inboundProcessId: inbound?.id || marked[0]?.id,
      outboundProcessId: outbound?.id || marked[marked.length - 1]?.id,
      resourceLimits,
      baselineParams: current,
      templates,
      trendDays: TREND_OFFSETS.map((offset, index) => {
        const day = this.addDays(date, index - 6);
        return {
          id: day,
          label: this.prettyDate(day).replace(/ \d{4}$/, ''),
          ...offset,
        };
      }),
      arrivals,
      processes: marked.map(({ operatorPlanned, robotPlanned, chutePlanned, ...process }) => process),
      guide: {
        simulation: `${warehouse.name} replays one working day in 30-minute steps. Parcels enter at ${inbound?.name || 'the first station'}, pass each process, and leave at ${outbound?.name || 'the last station'}. Today’s real ${focusName} roster is ${current.operators} operators, ${current.robots} robots and ${current.chutes} chutes. Move a slider to ask “what if”, then press play and watch the queue.`,
        scenarios: `These four plans all start from ${warehouse.name} as it is staffed today. Baseline keeps that roster. Volume +30% is the same team with a busier morning. The resource plan ${missing.length ? `fills ${missing.join(' and ')}` : 'is already at the planned roster'}. Hybrid adds a few chutes and a small speed-up. The highest score is the plan that protects service, clears the queue, and still gets the work out. The seven-day chart uses today’s real staffing; earlier days are a typical busy-week swing around that baseline, not a saved history.`,
      },
    };
  }

  private toSimulationProcess(process: RuntimeProcess) {
    const operators = this.resourceTotals(process, ResourceType.OPERATOR);
    const robots = this.resourceTotals(process, ResourceType.ROBOT);
    const chutes = this.resourceTotals(process, ResourceType.CHUTE);

    return {
      id: String(process.code || process.name).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: process.name,
      impact: process.name,
      slaMin: this.slaMinutes(process),
      baseCapacityPerHour: Math.max(Math.round(process.capacityPerHour), 1),
      operators: operators.available,
      operatorProductivity: operators.productivity,
      operatorPlanned: operators.planned,
      robots: robots.available,
      robotProductivity: robots.productivity,
      robotPlanned: robots.planned,
      chutes: chutes.available,
      chuteProductivity: chutes.productivity,
      chutePlanned: chutes.planned,
      usesScenarioOperators: false,
      usesScenarioRobots: false,
      usesScenarioChutes: false,
    };
  }

  private resourceTotals(process: RuntimeProcess, type: ResourceType) {
    const items = process.resources.filter((resource) => resource.resourceType === type);
    const productivity = items.length
      ? items.reduce((sum, resource) => sum + resource.productivity, 0) / items.length
      : 0;

    return {
      planned: Math.round(items.reduce((sum, resource) => sum + resource.plannedQuantity, 0)),
      available: Math.round(items.reduce((sum, resource) => sum + resource.availableQuantity, 0)),
      productivity,
    };
  }

  private slaMinutes(process: RuntimeProcess) {
    const value = Number(process.sla) || 30;
    const unit = String(process.slaUnit || 'MIN').toUpperCase();
    if (unit.startsWith('HOUR')) return Math.round(value * 60);
    if (unit.startsWith('DAY')) return Math.round(value * 24 * 60);
    return Math.max(1, Math.round(value));
  }

  private prettyDate(date: string) {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${date}T00:00:00.000Z`));
  }

  private runtimeList(
    context: DashboardContext,
    staffing: StaffingMode,
    hours: number,
  ) {
    return context.warehouseConfigs.map((item) =>
      this.buildWarehouse(item, staffing, hours),
    );
  }

  private measureProcess(process: RuntimeProcess) {
    const workload = Math.round(process.capacityPerHour);
    const processing = process.resources.length
      ? process.loadPct > 0
        ? Math.round(process.capacityPerHour / (process.loadPct / 100))
        : 0
      : workload;
    const load = process.resources.length
      ? process.loadPct
      : processing > 0
        ? Math.round((workload / processing) * 100)
        : 0;
    const util = this.clamp(Math.round(load), 0, 100);
    const excess = Math.max(0, workload - processing);
    const queue = Math.round(excess * 2.5);
    const wait = processing > 0 ? Math.round((queue / processing) * 60) : 0;
    const sla = this.clamp(
      Math.round((Math.min(processing, workload) / Math.max(workload, 1)) * 100),
      0,
      100,
    );

    return {
      workload,
      processing,
      load,
      util,
      queue,
      wait,
      sla,
      status: this.statusFrom(load, sla),
    };
  }

  private processLabel(process: RuntimeProcess) {
    return process.bottleneckLabel.startsWith('Robo ')
      ? `Robo / Manual ${process.name}`
      : process.name;
  }

  private toOpsMap(
    current: RuntimeWarehouse[],
    baseline: RuntimeWarehouse[],
    suffix: string,
    staffing: StaffingMode,
    timeframe: ControlTowerTimeframe,
  ) {
    const baselineByCode = new Map(
      baseline.map((warehouse) => [warehouse.code, warehouse]),
    );

    return Object.fromEntries(
      current.map((warehouse) => [
        warehouse.code,
        this.toOpsSlice(
          warehouse,
          baselineByCode.get(warehouse.code),
          suffix,
          staffing,
          timeframe,
        ),
      ]),
    );
  }

  private toOpsSlice(
    warehouse: RuntimeWarehouse,
    baseline: RuntimeWarehouse | undefined,
    suffix: string,
    staffing: StaffingMode,
    timeframe: ControlTowerTimeframe,
  ) {
    const measured = warehouse.processes.map((process) => ({
      process,
      metrics: this.measureProcess(process),
    }));
    const worst = [...measured].sort(
      (left, right) =>
        right.metrics.load - left.metrics.load ||
        right.metrics.queue - left.metrics.queue,
    )[0];
    const baselineMatch = baseline?.processes.find(
      (process) => process.name === worst?.process.name,
    );
    const baselineWait = baselineMatch ? this.measureProcess(baselineMatch).wait : 0;
    const wait = worst?.metrics.wait ?? 0;
    const unit =
      timeframe === ControlTowerTimeframe.LAST7
        ? 'Avg Units / Day'
        : 'Units / Day';
    const throughputTrend = this.percentTrend(
      warehouse.throughput,
      baseline?.throughput ?? 0,
      suffix,
    );
    const capacityTrend = baseline
      ? this.pointTrend(warehouse.capacity, baseline.capacity, suffix)
      : { trend: '', trendClass: '' };
    const slaTrend = baseline
      ? this.pointTrend(warehouse.sla, baseline.sla, suffix)
      : { trend: '', trendClass: '' };
    const waitTrend = this.waitTrend(wait, baseline ? baselineWait : wait, suffix);
    const alertTrend = this.countTrend(
      warehouse.alerts.length,
      baseline?.alerts.length ?? warehouse.alerts.length,
      suffix,
    );
    const focusName = worst?.process.name || 'the floor';

    return {
      kpis: {
        throughput: this.formatNumber(warehouse.throughput),
        unit,
        throughputTrend: throughputTrend.trend,
        throughputTrendClass: throughputTrend.trendClass,
        capacity: `${warehouse.capacity}%`,
        capacityTrend: capacityTrend.trend,
        capacityTrendClass: capacityTrend.trendClass,
        sla: `${warehouse.sla}%`,
        slaTrend: slaTrend.trend,
        slaTrendClass: slaTrend.trendClass,
        wait: String(wait),
        waitTrend: waitTrend.trend,
        waitTrendClass: waitTrend.trendClass,
        alerts: String(warehouse.alerts.length),
        throughputDetail: `${warehouse.code} throughput: ${this.formatNumber(warehouse.throughput)} ${unit.toLowerCase()} from configured process capacity.`,
        capacityDetail: `Capacity utilization at ${warehouse.capacity}% from the tightest process load versus staffed resources.`,
        slaDetail: `SLA achievement at ${warehouse.sla}%, limited by ${focusName}.`,
        alertsDetail: warehouse.alerts.length
          ? `${warehouse.alerts.length} active alerts for ${warehouse.code}: ${warehouse.alerts.join('; ')}.`
          : `No active alerts for ${warehouse.code}.`,
      },
      insight: worst
        ? {
            subtitle: `${worst.process.bottleneckLabel} – ${warehouse.code}`,
            text: `Incoming workload (${this.formatNumber(worst.metrics.workload)}/hr) ${
              worst.metrics.workload > worst.metrics.processing
                ? 'exceeds'
                : 'is within'
            } capacity (${this.formatNumber(worst.metrics.processing)}/hr), with ${this.formatNumber(worst.metrics.queue)} units in queue.`,
          }
        : {
            subtitle: warehouse.code,
            text: 'No active processes are configured for this warehouse.',
          },
      focusProcess: worst?.process.name || '',
      flow: Object.fromEntries(
        measured.map(({ process, metrics }) => [
          process.name,
          metrics.status.statusClass,
        ]),
      ),
      processes: measured.map(({ process, metrics }) =>
        this.toOpsProcessRow(
          process,
          metrics,
          process.name === worst?.process.name,
        ),
      ),
      scenarios: worst
        ? this.buildOpsScenarios(warehouse, worst.process, worst.metrics, staffing)
        : [],
    };
  }

  private toOpsProcessRow(
    process: RuntimeProcess,
    metrics: ReturnType<ControltowerService['measureProcess']>,
    selected: boolean,
  ) {
    return {
      key: process.name,
      label: this.processLabel(process),
      workload: this.formatNumber(metrics.workload),
      capacity: this.formatNumber(metrics.processing),
      util: `${metrics.util}%`,
      queue: this.formatNumber(metrics.queue),
      wait: String(metrics.wait),
      sla: `${metrics.sla}%`,
      status: metrics.status.label,
      statusClass: metrics.status.statusClass,
      rowCritical: metrics.status.statusClass === 'critical',
      selected,
      workloadClass:
        metrics.workload > metrics.processing ? 'val-red' : 'val-green',
      capacityClass: metrics.workload > metrics.processing ? 'val-red' : '',
      utilClass: metrics.util >= 90 ? 'val-red' : 'val-green',
      queueClass: metrics.queue >= 100 ? 'val-red' : 'val-green',
      waitClass: metrics.wait >= 20 ? 'val-red' : 'val-green',
      slaClass:
        metrics.sla >= 90 ? 'val-green' : metrics.sla >= 85 ? '' : 'val-red',
    };
  }

  private buildOpsScenarios(
    warehouse: RuntimeWarehouse,
    process: RuntimeProcess,
    metrics: ReturnType<ControltowerService['measureProcess']>,
    staffing: StaffingMode,
  ) {
    const volumeWorkload = Math.round(metrics.workload * 1.3);
    const volumeQueue = Math.round(
      Math.max(0, volumeWorkload - metrics.processing) * 2.5,
    );
    const volumeSla = this.clamp(
      Math.round(
        (Math.min(metrics.processing, volumeWorkload) /
          Math.max(volumeWorkload, 1)) *
          100,
      ),
      0,
      100,
    );
    const robotGap = this.resourceGap(process, ResourceType.ROBOT, staffing);
    const operatorGap = this.resourceGap(
      process,
      ResourceType.OPERATOR,
      staffing,
    );
    const relief =
      robotGap + operatorGap > 0
        ? `Adding ${robotGap} robot${robotGap === 1 ? '' : 's'} and ${operatorGap} operator${operatorGap === 1 ? '' : 's'} closes the plan gap on ${process.name}.`
        : `Current ${process.name} staffing matches the plan at ${metrics.util}% utilization and ${metrics.sla}% SLA.`;

    const hybrid =
      robotGap + operatorGap > 0
        ? `Closing ${robotGap} robot and ${operatorGap} operator gaps on ${process.name} is the highest-throughput option in the current configuration.`
        : `${process.name} is already at the planned mix, so the current configuration is the highest-throughput option.`;

    return [
      {
        id: '1',
        title: 'Volume +30%',
        text: `Volume +30% on ${process.name} at ${warehouse.code}: incoming would rise to ${this.formatNumber(volumeWorkload)}/hr. Queue would grow to ~${this.formatNumber(volumeQueue)} units and SLA would move to approximately ${volumeSla}%.`,
      },
      {
        id: '2',
        title: 'Resource Optimization',
        text: relief,
      },
      {
        id: '3',
        title: 'Robo vs Manual vs Hybrid',
        text: `Hybrid staffing at ${warehouse.code} is ${warehouse.robots} robots and ${warehouse.people} operators. ${hybrid}`,
      },
    ];
  }

  private toProcessMap(warehouses: RuntimeWarehouse[], staffing: StaffingMode) {
    return Object.fromEntries(
      warehouses.map((warehouse) => [
        warehouse.code,
        Object.fromEntries(
          warehouse.processes.map((process) => [
            process.name,
            this.toProcessDetail(process, warehouse.code, staffing),
          ]),
        ),
      ]),
    );
  }

  private toProcessDetail(
    process: RuntimeProcess,
    warehouseCode: string,
    staffing: StaffingMode,
  ) {
    const metrics = this.measureProcess(process);
    const colors = this.statusColors(metrics.status.statusClass);
    const timing = this.itemSeconds(process, metrics.processing);
    const downstream =
      metrics.load >= 90 ? 'High' : metrics.load >= 80 ? 'Medium' : 'Low';
    const journeys = Math.max(metrics.queue > 0 ? 1 : 0, Math.round(metrics.queue / 39));

    return {
      warehouse: warehouseCode,
      process: process.name,
      label: this.processLabel(process),
      status: metrics.status.label,
      statusColor: colors.statusColor,
      queue: `${this.formatNumber(metrics.queue)} Units`,
      wait: `${metrics.wait} mins`,
      util: metrics.util,
      workload: metrics.workload,
      capacity: metrics.processing,
      sla: metrics.sla,
      gaugeColor: colors.gaugeColor,
      incoming: `${this.formatNumber(metrics.workload)} Units/hr`,
      processing: `${this.formatNumber(metrics.processing)} Units/hr`,
      scan: timing.scan,
      proctime: timing.proctime,
      downstream,
      downstreamClass: downstream === 'High' ? 'impact-high' : '',
      journeys: `${this.formatNumber(journeys)} Journeys | ${this.formatNumber(metrics.queue)} Units`,
      resources: this.resourceCards(process, staffing),
      actions: this.processActions(process, staffing),
      queueChart: this.queueChart(metrics.queue),
      slaChart: this.slaChart(metrics.sla, colors.statusColor),
    };
  }

  private resourceGap(
    process: RuntimeProcess,
    type: ResourceType,
    staffing: StaffingMode,
  ) {
    const items = process.resources.filter(
      (resource) => resource.resourceType === type,
    );
    const planned = Math.round(
      items.reduce((sum, resource) => sum + resource.plannedQuantity, 0),
    );
    const staffed = Math.round(
      items.reduce(
        (sum, resource) => sum + this.staffedQuantity(resource, staffing),
        0,
      ),
    );

    return Math.max(planned - staffed, 0);
  }

  private resourceCards(process: RuntimeProcess, staffing: StaffingMode) {
    const specs = [
      { type: ResourceType.ROBOT, label: 'Robots', verb: 'Active' },
      { type: ResourceType.CHUTE, label: 'Chutes', verb: 'Available' },
      { type: ResourceType.OPERATOR, label: 'Operators', verb: 'Present' },
    ];

    return specs.flatMap((spec) => {
      const items = process.resources.filter(
        (resource) => resource.resourceType === spec.type,
      );
      const planned = Math.round(
        items.reduce((sum, resource) => sum + resource.plannedQuantity, 0),
      );
      const staffed = Math.round(
        items.reduce(
          (sum, resource) => sum + this.staffedQuantity(resource, staffing),
          0,
        ),
      );

      if (!planned && !staffed) return [];

      const pct = planned
        ? this.clamp(Math.round((staffed / planned) * 100), 0, 100)
        : 0;
      const gap = Math.max(planned - staffed, 0);

      return [
        {
          label: spec.label,
          value: `${staffed} / ${planned} ${spec.verb}`,
          pct,
          bar: pct >= 90 ? 'green' : pct >= 75 ? 'orange' : 'red',
          detail: gap
            ? `${staffed} of ${planned} ${spec.label.toLowerCase()} ${spec.verb.toLowerCase()}. ${gap} below plan.`
            : `${staffed} of ${planned} ${spec.label.toLowerCase()} ${spec.verb.toLowerCase()}.`,
        },
      ];
    });
  }

  private processActions(process: RuntimeProcess, staffing: StaffingMode) {
    const actions = [
      { type: ResourceType.ROBOT, text: (gap: number) => `Add ${gap} Robot${gap === 1 ? '' : 's'}` },
      {
        type: ResourceType.OPERATOR,
        text: (gap: number) => `Add ${gap} Operator${gap === 1 ? '' : 's'}`,
      },
      {
        type: ResourceType.CHUTE,
        text: (gap: number) => `Increase Chutes by ${gap}`,
      },
    ].flatMap((spec) => {
      const gap = this.resourceGap(process, spec.type, staffing);
      return gap > 0 ? [spec.text(gap)] : [];
    });

    return actions.length ? actions : ['Hold current staffing'];
  }

  private itemSeconds(process: RuntimeProcess, processing: number) {
    const rates = process.resources
      .map((resource) => resource.productivity)
      .filter((rate) => rate > 0);
    const rate = rates.length
      ? rates.reduce((sum, value) => sum + value, 0) / rates.length
      : processing;

    if (!rate) {
      return { scan: '—', proctime: '—' };
    }

    const proc = 3600 / rate;

    return {
      scan: `${(proc * 0.62).toFixed(1)} sec`,
      proctime: `${proc.toFixed(1)} sec`,
    };
  }

  private statusColors(statusClass: string) {
    if (statusClass === 'critical') {
      return { statusColor: '#dc2626', gaugeColor: '#ef4444' };
    }

    if (statusClass === 'at-risk') {
      return { statusColor: '#d97706', gaugeColor: '#f97316' };
    }

    return { statusColor: '#059669', gaugeColor: '#059669' };
  }

  private queueChart(queue: number) {
    const peak = this.niceCeil(Math.max(queue * 1.25, 100));
    const maxShare = Math.max(...DAY_PROFILE);
    const x0 = 44;
    const x1 = 378;
    const y0 = 120;
    const y1 = 13.6;
    const coords = DAY_PROFILE.map((share, index) => {
      const value = queue * (0.45 + 0.55 * (share / maxShare));
      const x = x0 + (index / (DAY_PROFILE.length - 1)) * (x1 - x0);
      const y = y0 - (value / peak) * (y0 - y1);

      return {
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
      };
    });
    const hourLabels = ['12 AM', '4 AM', '8 AM', '12 PM', '4 PM', '8 PM'];

    return {
      points: coords.map((point) => `${point.x},${point.y}`).join(' '),
      xLabels: hourLabels.map((label, index) => ({
        x: coords[index * 2]?.x ?? x0,
        label,
      })),
      yLabels: [0, 0.25, 0.5, 0.75, 1].map((fraction) => ({
        y: Math.round((y0 - fraction * (y0 - y1)) * 10) / 10,
        label: this.compactNumber(Math.round(peak * fraction)),
      })),
    };
  }

  private slaChart(sla: number, color: string) {
    const xs = [0, 14, 28, 42, 56, 70, 84, 98, 112, 126, 140];
    const points = xs
      .map((x, index) => {
        const wobble = Math.sin(index * 1.3) * 4;
        const y = this.clamp(Math.round(40 - (sla / 100) * 26 + wobble), 8, 42);
        return `${x},${y}`;
      })
      .join(' ');

    return { points, color };
  }

  private waitTrend(current: number, previous: number, suffix: string) {
    const delta = Math.round(current - previous);

    if (delta === 0) {
      return { trend: `→ Same as ${suffix}`, trendClass: 'orange' };
    }

    if (delta > 0) {
      return { trend: `↑ ${delta} mins vs ${suffix}`, trendClass: 'orange' };
    }

    return { trend: `↓ ${Math.abs(delta)} mins vs ${suffix}`, trendClass: 'up' };
  }

  private compactNumber(value: number) {
    if (value >= 1000) {
      const scaled = value / 1000;
      return Number.isInteger(scaled) ? `${scaled}K` : `${scaled.toFixed(1)}K`;
    }

    return String(value);
  }

  private niceCeil(value: number) {
    if (value <= 0) return 100;

    const pow = 10 ** Math.floor(Math.log10(value));
    const normalized = value / pow;
    const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;

    return step * pow;
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
