import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class UpdatePermissionDto {
  @ApiProperty({
    example: '68c23456789abcdef1234567',
    description: 'Screen MongoDB ObjectId',
  })
  @IsMongoId()
  @IsNotEmpty()
  screenId: string;

  @ApiProperty({
    example: [
      '68c3456789abcdef12345678',
      '68c456789abcdef123456789',
      '68c56789abcdef1234567890',
    ],
    description: 'List of action MongoDB ObjectIds assigned to the screen',
    type: [String],
  })
  @IsArray()
  @IsMongoId({ each: true })
  actionIds: string[];
}