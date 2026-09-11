import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ScreenDocument = HydratedDocument<Screen>;

@Schema({
  timestamps: true,
  collection: 'screens',
})
export class Screen {
  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  })
  code: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Menu',
    required: true,
  })
  menuId: Types.ObjectId;

  @Prop({
    trim: true,
  })
  route?: string;

  @Prop({
    trim: true,
  })
  description?: string;

  @Prop({
    default: 0,
  })
  sortOrder: number;

  @Prop({
    default: true,
  })
  isActive: boolean;
}

export const ScreenSchema = SchemaFactory.createForClass(Screen);

ScreenSchema.index({ code: 1 }, { unique: true });
ScreenSchema.index({ menuId: 1 });