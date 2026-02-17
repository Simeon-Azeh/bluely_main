import mongoose, { Schema, Document } from 'mongoose';

export interface IMoodLog extends Document {
    userId: mongoose.Types.ObjectId;
    firebaseUid: string;
    mood: 'Great' | 'Good' | 'Okay' | 'Low' | 'Rough';
    period: 'morning' | 'afternoon' | 'evening';
    note?: string;
    createdAt: Date;
    updatedAt: Date;
}

const MoodLogSchema = new Schema<IMoodLog>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        firebaseUid: {
            type: String,
            required: true,
            index: true,
        },
        mood: {
            type: String,
            enum: ['Great', 'Good', 'Okay', 'Low', 'Rough'],
            required: true,
        },
        period: {
            type: String,
            enum: ['morning', 'afternoon', 'evening'],
            required: true,
        },
        note: {
            type: String,
            trim: true,
            maxlength: 500,
        },
    },
    {
        timestamps: true,
    }
);

MoodLogSchema.index({ firebaseUid: 1, createdAt: -1 });

export const MoodLog = mongoose.model<IMoodLog>('MoodLog', MoodLogSchema);
export default MoodLog;
