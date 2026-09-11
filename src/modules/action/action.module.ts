import { Module } from '@nestjs/common';
import { ActionService } from './action.service.js';
import { ActionController } from './action.controller.js';

@Module({
  controllers: [ActionController],
  providers: [ActionService],
})
export class ActionModule {}
