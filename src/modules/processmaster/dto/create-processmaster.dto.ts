import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsString,
    IsNotEmpty,
    IsBoolean,
    IsNumber,
    IsOptional,
    IsEnum,
    Min,
} from 'class-validator';

import { SlaUnit } from '../../../schemas/process.schema.js';

export class CreateProcessmasterDto {
    @ApiProperty({
        example: 'PICKING',
        description: 'Unique code of the process',
    })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({
        example: 'Picking Process',
        description: 'Name of the process',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({
        example: 'Warehouse picking process',
        description: 'Description of the process',
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        example: 1,
        description: 'Sequence/order in which the process is executed',
    })
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    sequence: number;

    @ApiProperty({
        example: 100,
        description: 'Process capacity per hour',
    })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    capacityPerHour: number;

    @ApiProperty({
        example: 2,
        description: 'Service Level Agreement value',
    })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    sla: number;

    @ApiProperty({
        enum: SlaUnit,
        example: SlaUnit.HOUR,
        description: 'Unit of SLA',
    })
    @IsEnum(SlaUnit)
    slaUnit: SlaUnit;

    @ApiPropertyOptional({
        example: true,
        description: 'Whether the process is active',
        default: true,
    })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
