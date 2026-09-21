import { PartialType } from '@nestjs/swagger';
import { CreateConfigurationDto } from './create-configuration.dto.js';

export class UpdateConfigurationDto extends PartialType(
  CreateConfigurationDto,
) {}
