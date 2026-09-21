export enum ControlTowerTimeframe {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  LAST7 = 'last7',
}

export type ControlTowerKpi = {
  value: string;
  unit?: string;
  trend?: string;
  trendClass?: string;
  detail: string;
};

export type ControlTowerWarehouseMetrics = {
  throughput: string;
  capacity: number;
  barClass: string;
  sla: string;
  bottleneck: string;
  status: string;
  statusClass: string;
};

export type ControlTowerBottleneck = {
  name: string;
  pct: string;
  color: string;
};

export type ControlTowerChart = {
  series: Record<string, string>;
  xLabels: string[];
  [warehouseKey: string]: string | string[] | Record<string, string>;
};

export type ControlTowerRecommendation = {
  title: string;
  scenario: string;
  text: string;
  people: number;
  robots: number;
  alerts: number;
  simulations: number;
  peopleDetail: string;
  robotsDetail: string;
  simsDetail: string;
};

export type ControlTowerPayload = {
  kpis: {
    throughput: ControlTowerKpi;
    capacity: ControlTowerKpi;
    sla: ControlTowerKpi;
    bottlenecks: ControlTowerKpi;
    alerts: ControlTowerKpi;
  };
  warehouses: Record<string, ControlTowerWarehouseMetrics>;
  bottlenecks: ControlTowerBottleneck[];
  chart: ControlTowerChart;
  recommendation: ControlTowerRecommendation;
};

export type ControlTowerDashboard = {
  date: string;
  source: {
    warehouses: number;
    processes: number;
    configurations: number;
  };
  today: ControlTowerPayload;
  yesterday: ControlTowerPayload;
  last7: ControlTowerPayload;
};
