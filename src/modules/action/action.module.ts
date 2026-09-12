import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Action,
  ActionSchema,
} from '../../schemas/action.schema.js';
import { ActionsController } from './action.controller.js';
import { ActionsService } from './action.service.js';



@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Action.name,
        schema: ActionSchema,
      },
    ]),
  ],

  controllers: [ActionsController],

  providers: [ActionsService],

  exports: [ActionsService],
})
export class ActionsModule {}