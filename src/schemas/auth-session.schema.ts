import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

export type AuthSessionDocument =
  HydratedDocument<AuthSession>;

@Schema({
  timestamps: true,
  collection: 'auth_sessions',
})
export class AuthSession {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  sessionId: string;

  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  accessTokenJti: string;

  @Prop({
    required: true,
  })
  accessTokenHash: string;

  @Prop({
    required: true,
  })
  refreshTokenHash: string;

  @Prop({
    required: true,
  })
  accessTokenExpiresAt: Date;

  @Prop({
    required: true,
  })
  refreshTokenExpiresAt: Date;

  @Prop({
    default: true,
    index: true,
  })
  isActive: boolean;

  @Prop()
  lastActivityAt?: Date;

  @Prop()
  userAgent?: string;

  @Prop()
  ipAddress?: string;

  @Prop()
  revokedAt?: Date;

  @Prop()
  revokeReason?: string;
}

export const AuthSessionSchema =
  SchemaFactory.createForClass(AuthSession);

AuthSessionSchema.index({
  userId: 1,
  isActive: 1,
});

AuthSessionSchema.index({
  refreshTokenExpiresAt: 1,
});