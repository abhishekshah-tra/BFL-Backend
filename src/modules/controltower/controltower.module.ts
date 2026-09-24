import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Configuration,
  ConfigurationSchema,
} from '../../schemas/configuration.schema.js';
import { Process, ProcessSchema } from '../../schemas/process.schema.js';
import {
  Warehouse,
  WarehouseSchema,
} from '../../schemas/warehouse.schema.js';
import { ControltowerController } from './controltower.controller.js';
import { ControltowerService } from './controltower.service.js';
import { OperationsController } from './operations.controller.js';
import { ProcessDetailsController } from './process-details.controller.js';
import { SimulationController } from './simulation.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Warehouse.name,
        schema: WarehouseSchema,
      },
      {
        name: Process.name,
        schema: ProcessSchema,
      },
      {
        name: Configuration.name,
        schema: ConfigurationSchema,
      },
    ]),
  ],
  controllers: [
    ControltowerController,
    OperationsController,
    ProcessDetailsController,
    SimulationController,
  ],
  providers: [ControltowerService],
})
export class ControltowerModule {}
