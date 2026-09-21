import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import {
  ProductivityUnit,
  ResourceType,
  SlaUnit,
} from '../../../schemas/configuration.schema.js';

export class ConfigurationProcessDto {
  @ApiProperty({
    example: '68b123456789abcdef123456',
    description: 'Process master id',
  })
  @IsMongoId()
  processId: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this process is enabled for the warehouse',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiProperty({
    example: 2400,
    description: 'Warehouse-specific capacity per hour',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  capacityPerHour: number;

  @ApiProperty({
    example: 45,
    description: 'Warehouse-specific SLA value',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sla: number;

  @ApiProperty({
    enum: SlaUnit,
    example: SlaUnit.MIN,
    description: 'Unit of SLA',
  })
  @IsEnum(SlaUnit)
  slaUnit: SlaUnit;
}

export class ConfigurationResourceDto {
  @ApiProperty({
    enum: ResourceType,
    example: ResourceType.OPERATOR,
    description: 'Type of warehouse resource',
  })
  @IsEnum(ResourceType)
  resourceType: ResourceType;

  @ApiProperty({
    example: '68b123456789abcdef123456',
    description: 'Process this resource is assigned to',
  })
  @IsMongoId()
  processId: string;

  @ApiProperty({
    example: 14,
    description: 'Planned resource quantity',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  plannedQuantity: number;

  @ApiProperty({
    example: 12,
    description: 'Available resource quantity',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  availableQuantity: number;

  @ApiProperty({
    example: 200,
    description: 'Resource productivity',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  productivity: number;

  @ApiProperty({
    enum: ProductivityUnit,
    example: ProductivityUnit.ITEMS_HOUR,
    description: 'Productivity unit',
  })
  @IsEnum(ProductivityUnit)
  unit: ProductivityUnit;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the resource is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateConfigurationDto {
  @ApiProperty({
    example: '68b123456789abcdef123456',
    description: 'Warehouse master id',
  })
  @IsMongoId()
  warehouseId: string;

  @ApiProperty({
    example: 'TECHNO Default',
    description: 'Name of the warehouse configuration',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: '2026-08-15',
    description: 'Date from which this configuration is effective',
  })
  @IsDateString()
  effectiveFrom: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the configuration is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    type: [ConfigurationProcessDto],
    description: 'Process overrides for this warehouse',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfigurationProcessDto)
  processes: ConfigurationProcessDto[];

  @ApiPropertyOptional({
    type: [ConfigurationResourceDto],
    description: 'Resource configuration for this warehouse',
    default: [],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfigurationResourceDto)
  @IsOptional()
  resources?: ConfigurationResourceDto[];
}
