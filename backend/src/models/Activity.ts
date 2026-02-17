import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity extends Document {
    userId: mongoose.Types.ObjectId;
    firebaseUid: string;
    activityLevel: 'low' | 'medium' | 'high';
    activityType?: 'walking' | 'running' | 'gym' | 'sports' | 'other';
    durationMinutes?: number;
    timestamp: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
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
        activityLevel: {
            type: String,
            enum: ['low', 'medium', 'high'],
            required: true,
        },
        activityType: {
            type: String,
            enum: ['walking', 'running', 'gym', 'sports', 'other'],
        },
        durationMinutes: {
            type: Number,
            min: 1,
            max: 480,
        },
        timestamp: {
            type: Date,
            required: true,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

ActivitySchema.index({ firebaseUid: 1, timestamp: -1 });

export const Activity = mongoose.model<IActivity>('Activity', ActivitySchema);
export default Activity;
