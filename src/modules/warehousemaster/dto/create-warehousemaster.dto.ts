import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsBoolean,
} from 'class-validator';

import {
    ApiProperty,
    ApiPropertyOptional,
} from '@nestjs/swagger';

export class CreateWarehousemasterDto {
    @ApiProperty({
        example: 'TECHNO',
        description: 'Unique code of the warehouse',
    })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({
        example: 'TECHNO Warehouse',
        description: 'Name of the warehouse',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({
        example: 'Main sorting warehouse',
        description: 'Description of the warehouse',
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({
        example: 'Dubai',
        description: 'Location of the warehouse',
    })
    @IsString()
    @IsOptional()
    location?: string;

    @ApiPropertyOptional({
        example: 'UAE',
        description: 'Country where the warehouse is located',
    })
    @IsString()
    @IsOptional()
    country?: string;

    @ApiPropertyOptional({
        example: 'Asia/Dubai',
        description: 'Time zone of the warehouse',
    })
    @IsString()
    @IsOptional()
    timeZone?: string;

    @ApiPropertyOptional({
        example: true,
        description: 'Whether the warehouse is active',
        default: true,
    })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}