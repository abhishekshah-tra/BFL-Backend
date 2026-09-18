import { Test, TestingModule } from '@nestjs/testing';
import { ProcessmasterController } from './processmaster.controller.js';
import { ProcessmasterService } from './processmaster.service.js';

describe('ProcessmasterController', () => {
  let controller: ProcessmasterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProcessmasterController],
      providers: [
        {
          provide: ProcessmasterService,
          useValue: {
            create: vi.fn(),
            findAll: vi.fn(),
            findOne: vi.fn(),
            update: vi.fn(),
            remove: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProcessmasterController>(ProcessmasterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
