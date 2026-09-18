import { PartialType } from '@nestjs/swagger';
import { CreateProcessmasterDto } from './create-processmaster.dto.js';

export class UpdateProcessmasterDto extends PartialType(CreateProcessmasterDto) {}
