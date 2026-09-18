import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Process, ProcessSchema } from '../../schemas/process.schema.js';
import { ProcessmasterService } from './processmaster.service.js';
import { ProcessmasterController } from './processmaster.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Process.name,
        schema: ProcessSchema,
      },
    ]),
  ],
  controllers: [ProcessmasterController],
  providers: [ProcessmasterService],
})
export class ProcessmasterModule {}
