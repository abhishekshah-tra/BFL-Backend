import { Module } from '@nestjs/common';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import { DatabaseModule } from './database/database.module.js';

import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { PermissionsModule } from './modules/permissions/permissions.module.js';
import { HierarchyModule } from './modules/hierarchy/hierarchy.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { MenusModule } from './modules/menu/menu.module.js';
import { ActionsModule } from './modules/action/action.module.js';
import { RolesModule } from './modules/roles/roles.module.js';
import { ScreensModule } from './modules/screens/screens.module.js';
import { ConfigurationModule } from './modules/configuration/configuration.module.js';
import { ProcessmasterModule } from './modules/processmaster/processmaster.module.js';
import { WarehousemasterModule } from './modules/warehousemaster/warehousemaster.module.js';
import { ControltowerModule } from './modules/controltower/controltower.module.js';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    HierarchyModule,
    AuditModule,
    MenusModule,
    ActionsModule,
    ScreensModule,
    ConfigurationModule,
    ProcessmasterModule,
    WarehousemasterModule,
    ControltowerModule,
  ],

  controllers: [
    AppController,
  ],

  providers: [
    AppService,
  ],
})
export class AppModule {}