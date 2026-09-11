import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    example: 'Operation Manager',
  })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({
    example: 'OPERATION_MANAGER',
  })
  @IsString()
  @Matches(/^[A-Z0-9_]+$/)
  code: string;

  @ApiPropertyOptional({
    example: 'Manages operational activities',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}