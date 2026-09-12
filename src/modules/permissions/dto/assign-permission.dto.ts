import {
  IsMongoId,
  IsNotEmpty,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class AssignPermissionDto {
  @ApiProperty({
    example: '68c123456789abcdef123456',
    description: 'Role MongoDB ObjectId',
  })
  @IsMongoId()
  @IsNotEmpty()
  roleId: string;

  @ApiProperty({
    example: '68c23456789abcdef1234567',
    description: 'Screen MongoDB ObjectId',
  })
  @IsMongoId()
  @IsNotEmpty()
  screenId: string;

  @ApiProperty({
    example: '68c3456789abcdef12345678',
    description: 'Action MongoDB ObjectId',
  })
  @IsMongoId()
  @IsNotEmpty()
  actionId: string;
}