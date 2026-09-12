import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ScreenDocument = HydratedDocument<Screen>;

@Schema({
  timestamps: true,
  collection: 'screens',
})
export class Screen {
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
    type: Types.ObjectId,
    ref: 'Menu',
    required: true,
  })
  menuId: Types.ObjectId;

  @Prop({
    type: String,
    trim: true,
  })
  route?: string;

  @Prop({
    type: String,
    trim: true,
  })
  description?: string;

  @Prop({
    type: Number,
    default: 0,
  })
  sortOrder: number;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean;
}

export const ScreenSchema =
  SchemaFactory.createForClass(Screen);

ScreenSchema.index(
  { code: 1 },
  { unique: true },
);

ScreenSchema.index({
  menuId: 1,
});

ScreenSchema.index({
  sortOrder: 1,
});