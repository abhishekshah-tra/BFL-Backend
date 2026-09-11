import { Module } from '@nestjs/common';
import { ScreensService } from './screens.service.js';
import { ScreensController } from './screens.controller.js';

@Module({
  controllers: [ScreensController],
  providers: [ScreensService],
})
export class ScreensModule {}
