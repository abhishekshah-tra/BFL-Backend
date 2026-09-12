import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MenuDocument = HydratedDocument<Menu>;

@Schema({
  timestamps: true,
  collection: 'menus',
})
export class Menu {
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
    default: null,
  })
  parentId?: Types.ObjectId | null;

  @Prop({
    type: String,
    trim: true,
  })
  route?: string;

  @Prop({
    type: String,
    trim: true,
  })
  icon?: string;

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

export const MenuSchema =
  SchemaFactory.createForClass(Menu);

MenuSchema.index(
  { code: 1 },
  { unique: true },
);

MenuSchema.index({
  parentId: 1,
});

MenuSchema.index({
  sortOrder: 1,
});