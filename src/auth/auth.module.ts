import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import { JwtModule } from '@nestjs/jwt';

import { ConfigModule, ConfigService } from '@nestjs/config';

import {
  User,
  UserSchema,
} from '../schemas/user.schema.js';

import {
  Role,
  RoleSchema,
} from '../schemas/role.schema.js';

import {
  RolePermission,
  RolePermissionSchema,
} from '../schemas/role-permission.schema.js';

import {
  AuthSession,
  AuthSessionSchema,
} from '../schemas/auth-session.schema.js';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthGuard } from './auth.guard.js';

@Module({
  imports: [
    ConfigModule,

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
        name: RolePermission.name,
        schema: RolePermissionSchema,
      },
      {
        name: AuthSession.name,
        schema: AuthSessionSchema,
      },
    ]),

    JwtModule.registerAsync({
      imports: [ConfigModule],

      inject: [ConfigService],

      useFactory: (
        configService: ConfigService,
      ) => ({
        secret:
          configService.getOrThrow<string>(
            'JWT_SECRET',
          ),

        signOptions: {
          expiresIn: '15m',
        },
      }),
    }),
  ],

  controllers: [
    AuthController,
  ],

  providers: [
    AuthService,
    AuthGuard,
  ],

  exports: [
    AuthService,
    AuthGuard,
  ],
})
export class AuthModule {}