import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ActionDocument = HydratedDocument<Action>;

@Schema({
  timestamps: true,
  collection: 'actions',
})
export class Action {
  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  })
  code: string;

  @Prop({
    type: String,
    trim: true,
  })
  description?: string;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean;
}

export const ActionSchema =
  SchemaFactory.createForClass(Action);
