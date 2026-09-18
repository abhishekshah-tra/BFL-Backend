import { Test, TestingModule } from '@nestjs/testing';
import { WarehousemasterService } from './warehousemaster.service.js';

describe('WarehousemasterService', () => {
  let service: WarehousemasterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WarehousemasterService],
    }).compile();

    service = module.get<WarehousemasterService>(WarehousemasterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
