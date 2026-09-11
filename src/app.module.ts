import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { RolesModule } from './modules/roles/roles.module.js';
import { PermissionsModule } from './modules/permissions/permissions.module.js';
import { HierarchyModule } from './modules/hierarchy/hierarchy.module.js';
import { AuditModule } from './modules/audit/audit.module.js';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { mongoConfig } from './database/mongo.config.js';
import { MenuModule } from './modules/menu/menu.module.js';
import { ActionModule } from './modules/action/action.module.js';
import { ScreensModule } from './modules/screens/screens.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: mongoConfig,
    }),

    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    HierarchyModule,
    AuditModule,
    MenuModule,
    ActionModule,
    ScreensModule,
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}