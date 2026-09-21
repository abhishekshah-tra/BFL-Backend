import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';

import { Configuration } from '../../schemas/configuration.schema.js';
import { Process } from '../../schemas/process.schema.js';
import { Warehouse } from '../../schemas/warehouse.schema.js';
import { ConfigurationService } from './configuration.service.js';

describe('ConfigurationService', () => {
  let service: ConfigurationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigurationService,
        {
          provide: getModelToken(Configuration.name),
          useValue: {
            findOne: vi.fn(),
            find: vi.fn(),
            findById: vi.fn(),
            create: vi.fn(),
          },
        },
        {
          provide: getModelToken(Warehouse.name),
          useValue: {
            findById: vi.fn(),
          },
        },
        {
          provide: getModelToken(Process.name),
          useValue: {
            countDocuments: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ConfigurationService>(ConfigurationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
