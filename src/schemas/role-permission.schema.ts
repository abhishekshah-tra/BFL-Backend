import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RolePermissionDocument =
  HydratedDocument<RolePermission>;

@Schema({
  timestamps: true,
  collection: 'role_permissions',
})
export class RolePermission {
  @Prop({
    type: Types.ObjectId,
    ref: 'Role',
    required: true,
  })
  roleId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Screen',
    required: true,
  })
  screenId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Action',
    required: true,
  })
  actionId: Types.ObjectId;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean;
}

export const RolePermissionSchema =
  SchemaFactory.createForClass(RolePermission);

RolePermissionSchema.index(
  {
    roleId: 1,
    screenId: 1,
    actionId: 1,
  },
  {
    unique: true,
  },
);

RolePermissionSchema.index({
  roleId: 1,
  screenId: 1,
});

RolePermissionSchema.index({
  screenId: 1,
  actionId: 1,
});