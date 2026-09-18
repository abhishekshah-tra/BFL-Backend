import { PartialType } from '@nestjs/swagger';
import { CreateWarehousemasterDto } from './create-warehousemaster.dto.js';

export class UpdateWarehousemasterDto extends PartialType(CreateWarehousemasterDto) {}
