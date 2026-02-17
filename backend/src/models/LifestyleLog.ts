import mongoose, { Schema, Document } from 'mongoose';

export interface ILifestyleLog extends Document {
    userId: mongoose.Types.ObjectId;
    firebaseUid: string;
    exerciseFrequency: 'rare' | 'moderate' | 'frequent';
    sleepQuality: number;
    stressLevel: number;
    createdAt: Date;
    updatedAt: Date;
}

const LifestyleLogSchema = new Schema<ILifestyleLog>(
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
        exerciseFrequency: {
            type: String,
            enum: ['rare', 'moderate', 'frequent'],
            required: true,
        },
        sleepQuality: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        stressLevel: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
    },
    {
        timestamps: true,
    }
);

LifestyleLogSchema.index({ firebaseUid: 1, createdAt: -1 });

export const LifestyleLog = mongoose.model<ILifestyleLog>('LifestyleLog', LifestyleLogSchema);
export default LifestyleLog;
