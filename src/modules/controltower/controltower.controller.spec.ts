import { Test, TestingModule } from '@nestjs/testing';

import { ControltowerController } from './controltower.controller.js';
import { ControltowerService } from './controltower.service.js';

describe('ControltowerController', () => {
  let controller: ControltowerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ControltowerController],
      providers: [
        {
          provide: ControltowerService,
          useValue: {
            getDashboard: vi.fn(),
            listDates: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ControltowerController>(ControltowerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
