import {
  IsBoolean,
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'Rishi',
    description: 'User first name',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiPropertyOptional({
    example: 'Kumar',
    description: 'User last name',
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    example: 'rishi.kumar@example.com',
    description: 'Unique user email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'Password@123',
    description: 'User login password',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: '6aa5869918197151ad26f95e',
    description: 'Role ID assigned to the user',
  })
  @IsMongoId()
  @IsNotEmpty()
  roleId: string;

  @ApiPropertyOptional({
    example: true,
    description: 'User active status',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}