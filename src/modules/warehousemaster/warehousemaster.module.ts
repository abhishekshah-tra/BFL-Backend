import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Warehouse,
  WarehouseSchema,
} from '../../schemas/warehouse.schema.js';
import { WarehousemasterService } from './warehousemaster.service.js';
import { WarehousemasterController } from './warehousemaster.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Warehouse.name,
        schema: WarehouseSchema,
      },
    ]),
  ],
  controllers: [WarehousemasterController],
  providers: [WarehousemasterService],
})
export class WarehousemasterModule {}
