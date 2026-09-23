import {
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserStatusDto {
  @ApiProperty({
    example: false,
    description:
      'Set true to activate the user or false to deactivate the user',
  })
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}