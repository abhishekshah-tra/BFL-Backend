import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';

import { ProcessmasterService } from './processmaster.service.js';
import { Process } from '../../schemas/process.schema.js';

describe('ProcessmasterService', () => {
  let service: ProcessmasterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessmasterService,
        {
          provide: getModelToken(Process.name),
          useValue: {
            findOne: vi.fn(),
            find: vi.fn(),
            findById: vi.fn(),
            create: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProcessmasterService>(ProcessmasterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
