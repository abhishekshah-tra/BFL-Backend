import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Role,
  RoleSchema,
} from '../../schemas/role.schema.js';

import {
  Screen,
  ScreenSchema,
} from '../../schemas/screen.schema.js';

import {
  Action,
  ActionSchema,
} from '../../schemas/action.schema.js';

import {
  RolePermission,
  RolePermissionSchema,
} from '../../schemas/role-permission.schema.js';

import { PermissionsController } from './permissions.controller.js';
import { PermissionsService } from './permissions.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: RolePermission.name,
        schema: RolePermissionSchema,
      },
      {
        name: Role.name,
        schema: RoleSchema,
      },
      {
        name: Screen.name,
        schema: ScreenSchema,
      },
      {
        name: Action.name,
        schema: ActionSchema,
      },
    ]),
  ],

  controllers: [PermissionsController],

  providers: [PermissionsService],

  exports: [PermissionsService],
})
export class PermissionsModule {}