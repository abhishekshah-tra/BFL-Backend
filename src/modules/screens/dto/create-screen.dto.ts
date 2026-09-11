import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateScreenDto {
  @ApiProperty({
    example: 'User List',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'USER_LIST',
  })
  @IsString()
  code: string;

  @ApiProperty({
    example: '68b123456789abcdef123456',
  })
  @IsMongoId()
  menuId: string;

  @ApiPropertyOptional({
    example: '/users',
  })
  @IsOptional()
  @IsString()
  route?: string;

  @ApiPropertyOptional({
    example: 'User listing screen',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}