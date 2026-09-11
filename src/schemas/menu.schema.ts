import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MenuDocument = HydratedDocument<Menu>;

@Schema({
  timestamps: true,
  collection: 'menus',
})
export class Menu {
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
    default: null,
  })
  parentId?: Types.ObjectId | null;

  @Prop({
    trim: true,
  })
  route?: string;

  @Prop({
    trim: true,
  })
  icon?: string;

  @Prop({
    default: 0,
  })
  sortOrder: number;

  @Prop({
    default: true,
  })
  isActive: boolean;
}

export const MenuSchema = SchemaFactory.createForClass(Menu);

MenuSchema.index({ code: 1 }, { unique: true });
MenuSchema.index({ parentId: 1 });
MenuSchema.index({ sortOrder: 1 });