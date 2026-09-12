import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Menu,
  MenuSchema,
} from '../../schemas/menu.schema.js';
import { MenusController } from './menu.controller.js';
import { MenusService } from './menu.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Menu.name,
        schema: MenuSchema,
      },
    ]),
  ],

  controllers: [MenusController],

  providers: [MenusService],

  exports: [MenusService],
})
export class MenusModule {}