import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { SlaUnit } from './process.schema.js';

export { SlaUnit };

export type ConfigurationDocument = HydratedDocument<Configuration>;

export enum ResourceType {
  OPERATOR = 'Operator',
  ROBOT = 'Robot',
  CHUTE = 'Chute',
}

export enum ProductivityUnit {
  ITEMS_HOUR = 'Items/Hour',
  PARCELS_HOUR = 'Parcels/Hour',
  ORDERS_HOUR = 'Orders/Hour',
}

@Schema({ _id: false })
export class ConfigurationProcess {
  @Prop({
    type: Types.ObjectId,
    ref: 'Process',
    required: true,
  })
  processId: Types.ObjectId;

  @Prop({
    type: Boolean,
    default: true,
  })
  enabled: boolean;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  capacityPerHour: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  sla: number;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(SlaUnit),
    uppercase: true,
  })
  slaUnit: SlaUnit;
}

export const ConfigurationProcessSchema =
  SchemaFactory.createForClass(ConfigurationProcess);

@Schema()
export class ConfigurationResource {
  @Prop({
    type: String,
    required: true,
    enum: Object.values(ResourceType),
  })
  resourceType: ResourceType;

  @Prop({
    type: Types.ObjectId,
    ref: 'Process',
    required: true,
  })
  processId: Types.ObjectId;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  plannedQuantity: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  availableQuantity: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  productivity: number;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(ProductivityUnit),
  })
  unit: ProductivityUnit;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean;
}

export const ConfigurationResourceSchema =
  SchemaFactory.createForClass(ConfigurationResource);

@Schema({
  timestamps: true,
  collection: 'configurations',
})
export class Configuration {
  @Prop({
    type: Types.ObjectId,
    ref: 'Warehouse',
    required: true,
  })
  warehouseId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    type: Date,
    required: true,
  })
  effectiveFrom: Date;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean;

  @Prop({
    type: [ConfigurationProcessSchema],
    default: [],
  })
  processes: ConfigurationProcess[];

  @Prop({
    type: [ConfigurationResourceSchema],
    default: [],
  })
  resources: ConfigurationResource[];
}

export const ConfigurationSchema =
  SchemaFactory.createForClass(Configuration);

ConfigurationSchema.index(
  { warehouseId: 1, name: 1 },
  { unique: true },
);
