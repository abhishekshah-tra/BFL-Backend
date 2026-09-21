import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SeedService } from './seed.service.js';
import { Role, RoleSchema } from '../role.schema.js';
import { Action, ActionSchema } from '../action.schema.js';
import { Menu, MenuSchema } from '../menu.schema.js';
import { Screen, ScreenSchema } from '../screen.schema.js';
import { RolePermission, RolePermissionSchema } from '../role-permission.schema.js';
import { Process, ProcessSchema } from '../process.schema.js';
import { Warehouse, WarehouseSchema } from '../warehouse.schema.js';
import {
  Configuration,
  ConfigurationSchema,
} from '../configuration.schema.js';
import { DatabaseModule } from '../../database/database.module.js';

@Module({
  imports: [
    DatabaseModule,
    MongooseModule.forFeature([
      {
        name: Role.name,
        schema: RoleSchema,
      },
      {
        name: Action.name,
        schema: ActionSchema,
      },
      {
        name: Menu.name,
        schema: MenuSchema,
      },
      {
        name: Screen.name,
        schema: ScreenSchema,
      },
      {
        name: RolePermission.name,
        schema: RolePermissionSchema,
      },
      {
        name: Process.name,
        schema: ProcessSchema,
      },
      {
        name: Warehouse.name,
        schema: WarehouseSchema,
      },
      {
        name: Configuration.name,
        schema: ConfigurationSchema,
      },
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}