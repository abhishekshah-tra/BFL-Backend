import {
    ArrayMinSize,
    IsArray,
    IsMongoId,
    IsNotEmpty,
    ValidateNested,
} from 'class-validator';

import {
    ApiProperty,
} from '@nestjs/swagger';

import {
    Type,
} from 'class-transformer';

export class RolePermissionItemDto {
    @ApiProperty({
        example: '6aa7dc6e18197151ad26fa57',
        description: 'Screen MongoDB ObjectId',
    })
    @IsMongoId()
    @IsNotEmpty()
    screenId: string;

    @ApiProperty({
        example: '6aa5869918197151ad26f964',
        description: 'Action MongoDB ObjectId',
    })
    @IsMongoId()
    @IsNotEmpty()
    actionId: string;
}

export class UpdateRolePermissionsDto {
    @ApiProperty({
        type: [RolePermissionItemDto],
        example: [
            {
                screenId: '6aa7dc6e18197151ad26fa57',
                actionId: '6aa5869918197151ad26f964',
            },
            {
                screenId: '6aa7dc6e18197151ad26fa57',
                actionId: '6aa5869918197151ad26f965',
            },
            {
                screenId: '6aa7dc6e18197151ad26fa58',
                actionId: '6aa5869918197151ad26f964',
            },
        ],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RolePermissionItemDto)
    permissions: RolePermissionItemDto[];
}