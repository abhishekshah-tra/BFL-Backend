import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { User, UserSchema } from '../../schemas/user.schema.js';
import { Role, RoleSchema } from '../../schemas/role.schema.js';


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
    ]),
  ],

  controllers: [
    UsersController,
  ],

  providers: [
    UsersService,
  ],

  exports: [
    UsersService,
  ],
})
export class UsersModule {}