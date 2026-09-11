import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateActionDto {
  @ApiProperty({
    example: 'Create',
  })
  @IsString()
  @Length(2, 50)
  name: string;

  @ApiProperty({
    example: 'CREATE',
  })
  @IsString()
  @Matches(/^[A-Z0-9_]+$/)
  code: string;

  @ApiPropertyOptional({
    example: 'Create a new record',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}