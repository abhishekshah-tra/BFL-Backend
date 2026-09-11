import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ActionDocument = HydratedDocument<Action>;

@Schema({
    timestamps: true,
    collection: 'actions',
})
export class Action {
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
        trim: true,
    })
    description?: string;

    @Prop({
        default: true,
    })
    isActive: boolean;
}

export const ActionSchema = SchemaFactory.createForClass(Action);

ActionSchema.index(
    { code: 1 },
    {
        unique: true,
    },
);