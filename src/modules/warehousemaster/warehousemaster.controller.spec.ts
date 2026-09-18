import { Test, TestingModule } from '@nestjs/testing';
import { WarehousemasterController } from './warehousemaster.controller.js';
import { WarehousemasterService } from './warehousemaster.service.js';

describe('WarehousemasterController', () => {
  let controller: WarehousemasterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WarehousemasterController],
      providers: [WarehousemasterService],
    }).compile();

    controller = module.get<WarehousemasterController>(WarehousemasterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
