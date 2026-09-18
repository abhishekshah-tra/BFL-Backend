import { Module } from '@nestjs/common';
import { ConfigurationService } from './configuration.service.js';
import { ConfigurationController } from './configuration.controller.js';

@Module({
  controllers: [ConfigurationController],
  providers: [ConfigurationService],
})
export class ConfigurationModule {}
