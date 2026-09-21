import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';

import { Configuration } from '../../schemas/configuration.schema.js';
import { Process } from '../../schemas/process.schema.js';
import { Warehouse } from '../../schemas/warehouse.schema.js';
import { ControltowerService } from './controltower.service.js';
import { ControlTowerTimeframe } from './controltower.types.js';

const warehouses = [
  {
    _id: 'w1',
    code: 'YOTO',
    name: 'YOTO Warehouse',
    isActive: true,
  },
];

const processes = [
  {
    _id: 'p1',
    code: 'RECEIVING',
    name: 'Receiving',
    sequence: 1,
    capacityPerHour: 1000,
    sla: 30,
    slaUnit: 'MIN',
    isActive: true,
  },
  {
    _id: 'p2',
    code: 'SORTING',
    name: 'Sorting',
    sequence: 2,
    capacityPerHour: 800,
    sla: 45,
    slaUnit: 'MIN',
    isActive: true,
  },
];

const configurations = [
  {
    warehouseId: 'w1',
    isActive: true,
    effectiveFrom: new Date('2026-01-01'),
    processes: [
      {
        processId: 'p1',
        enabled: true,
        capacityPerHour: 1000,
        sla: 30,
        slaUnit: 'MIN',
      },
      {
        processId: 'p2',
        enabled: true,
        capacityPerHour: 800,
        sla: 45,
        slaUnit: 'MIN',
      },
    ],
    resources: [
      {
        resourceType: 'Operator',
        processId: 'p1',
        plannedQuantity: 10,
        availableQuantity: 8,
        productivity: 100,
        isActive: true,
      },
      {
        resourceType: 'Robot',
        processId: 'p2',
        plannedQuantity: 5,
        availableQuantity: 4,
        productivity: 150,
        isActive: true,
      },
    ],
  },
];

function findChain(docs: unknown[]) {
  return {
    sort: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue(docs),
    }),
  };
}

describe('ControltowerService', () => {
  let service: ControltowerService;
  const warehouseModel = { find: vi.fn() };
  const processModel = { find: vi.fn() };
  const configurationModel = { find: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    warehouseModel.find.mockReturnValue(findChain(warehouses));
    processModel.find.mockReturnValue(findChain(processes));
    configurationModel.find.mockReturnValue(findChain(configurations));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ControltowerService,
        {
          provide: getModelToken(Warehouse.name),
          useValue: warehouseModel,
        },
        {
          provide: getModelToken(Process.name),
          useValue: processModel,
        },
        {
          provide: getModelToken(Configuration.name),
          useValue: configurationModel,
        },
      ],
    }).compile();

    service = module.get<ControltowerService>(ControltowerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('computes today, yesterday, and last7 from warehouse configuration', async () => {
    const result = await service.getDashboard({ date: '2026-09-21' });

    expect('today' in result).toBe(true);
    if (!('today' in result)) return;

    expect(result.source).toEqual({
      warehouses: 1,
      processes: 2,
      configurations: 1,
    });
    expect(result.today.warehouses.YOTO).toBeDefined();
    expect(result.today.warehouses.YOTO.bottleneck).toMatch(/Sorting|Receiving/);
    expect(result.today.kpis.throughput.value).toBe('7,200');
    expect(result.yesterday.kpis.throughput.value).toBe('9,000');
    expect(result.last7.kpis.throughput.unit).toBe('Units / Week');
    expect(result.today.chart.series.YOTO).toBeTruthy();
    expect(result.today.chart.yoto).toBe(result.today.chart.series.YOTO);
  });

  it('returns a single timeframe slice from live masters', async () => {
    const result = await service.getDashboard({
      date: '2026-09-21',
      timeframe: ControlTowerTimeframe.TODAY,
    });

    expect('kpis' in result).toBe(true);
    if (!('kpis' in result)) return;

    expect(result.warehouses.YOTO.throughput).toBe('7,200');
    expect(result.recommendation.people).toBe(8);
    expect(result.recommendation.robots).toBe(4);
  });

  it('throws when no active warehouses exist', async () => {
    warehouseModel.find.mockReturnValue(findChain([]));

    await expect(
      service.getDashboard({ date: '2026-09-21' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
