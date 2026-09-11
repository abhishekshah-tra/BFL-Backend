import { Module, OnModuleInit } from '@nestjs/common';
import {
  InjectConnection,
  MongooseModule,
} from '@nestjs/mongoose';
import { Connection } from 'mongoose';

import {
  User,
  UserSchema,
} from './user.schema.js';

import {
  Role,
  RoleSchema,
} from './role.schema.js';

import {
  Menu,
  MenuSchema,
} from './menu.schema.js';

import {
  Screen,
  ScreenSchema,
} from './screen.schema.js';

import {
  Action,
  ActionSchema,
} from './action.schema.js';

import {
  RolePermission,
  RolePermissionSchema,
} from './role-permission.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: Role.name,
        schema: RoleSchema,
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
        name: Action.name,
        schema: ActionSchema,
      },
      {
        name: RolePermission.name,
        schema: RolePermissionSchema,
      },
    ]),
  ],

  exports: [
    MongooseModule,
  ],
})
export class SchemasModule implements OnModuleInit {
  constructor(
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async onModuleInit(): Promise<void> {
    const models = [
      {
        name: User.name,
        collection: 'users',
      },
      {
        name: Role.name,
        collection: 'roles',
      },
      {
        name: Menu.name,
        collection: 'menus',
      },
      {
        name: Screen.name,
        collection: 'screens',
      },
      {
        name: Action.name,
        collection: 'actions',
      },
      {
        name: RolePermission.name,
        collection: 'role_permissions',
      },
    ];

    for (const model of models) {
      try {
        const mongooseModel = this.connection.model(model.name);

        await mongooseModel.createCollection();

        console.log(
          `✅ ${model.collection} collection created/verified`,
        );
      } catch (error: any) {
        // Collection already exists
        if (error?.codeName === 'NamespaceExists') {
          console.log(
            `✅ ${model.collection} collection already exists`,
          );
          continue;
        }

        console.error(
          `❌ Failed to create ${model.collection} collection:`,
          error?.message || error,
        );
      }
    }
  }
}