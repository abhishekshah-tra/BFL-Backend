import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WarehouseDocument = HydratedDocument<Warehouse>;

@Schema({
    timestamps: true,
    collection: 'warehouses',
})
export class Warehouse {
    // Warehouse Code
    @Prop({
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
    })
    code: string;

    // Warehouse Name
    @Prop({
        type: String,
        required: true,
        trim: true,
    })
    name: string;

    // Description
    @Prop({
        type: String,
        trim: true,
        default: null,
    })
    description: string;

    // Location
    @Prop({
        type: String,
        trim: true,
        default: null,
    })
    location: string;

    // Country
    @Prop({
        type: String,
        trim: true,
        default: null,
    })
    country: string;

    // Time Zone
    @Prop({
        type: String,
        trim: true,
        default: null,
    })
    timeZone: string;

    // Active
    @Prop({
        type: Boolean,
        default: true,
    })
    isActive: boolean;
}

export const WarehouseSchema = SchemaFactory.createForClass(Warehouse);