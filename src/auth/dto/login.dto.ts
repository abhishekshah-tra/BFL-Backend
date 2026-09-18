import {
  IsEmail,
  IsNotEmpty,
  IsString,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'rishi.kumar@trangile.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'Rishi@1993',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}