import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProcessDocument = HydratedDocument<Process>;

export enum SlaUnit {
    MIN = 'MIN',
    HOUR = 'HOUR',
    DAYS = 'DAYS',
}

@Schema({
    timestamps: true,
    collection: 'processes',
})
export class Process {
    // Process Code
    @Prop({
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
    })
    code: string;

    // Process Name
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

    // Sequence
    @Prop({
        type: Number,
        required: true,
        min: 1,
    })
    sequence: number;

    // Capacity / Hour
    @Prop({
        type: Number,
        required: true,
        min: 0,
    })
    capacityPerHour: number;

    // SLA
    @Prop({
        type: Number,
        required: true,
        min: 0,
    })
    sla: number;

    // SLA Unit
    @Prop({
        type: String,
        required: true,
        enum: Object.values(SlaUnit),
        uppercase: true,
    })
    slaUnit: SlaUnit;

    // Active
    @Prop({
        type: Boolean,
        default: true,
    })
    isActive: boolean;
}

export const ProcessSchema = SchemaFactory.createForClass(Process);