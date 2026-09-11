import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsMongoId,
  IsOptional,
} from 'class-validator';

export class CreateRolePermissionDto {
  @ApiProperty({
    example: '68b123456789abcdef123456',
  })
  @IsMongoId()
  roleId: string;

  @ApiProperty({
    example: '68b123456789abcdef123457',
  })
  @IsMongoId()
  screenId: string;

  @ApiProperty({
    example: '68b123456789abcdef123458',
  })
  @IsMongoId()
  actionId: string;

  @ApiPropertyOptional({
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}