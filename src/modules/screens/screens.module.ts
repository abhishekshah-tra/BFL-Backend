import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Screen,
  ScreenSchema,
} from '../../schemas/screen.schema.js';

import {
  Menu,
  MenuSchema,
} from '../../schemas/menu.schema.js';

import { ScreensController } from './screens.controller.js';
import { ScreensService } from './screens.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Screen.name,
        schema: ScreenSchema,
      },
      {
        name: Menu.name,
        schema: MenuSchema,
      },
    ]),
  ],

  controllers: [ScreensController],

  providers: [ScreensService],

  exports: [ScreensService],
})
export class ScreensModule {}