import mongoose, { Schema, Document } from 'mongoose';

export interface IUserHealthProfile extends Document {
    userId: mongoose.Types.ObjectId;
    firebaseUid: string;

    // Lifestyle
    activityLevel?: 'low' | 'medium' | 'high';
    exerciseFrequency?: 'rare' | 'moderate' | 'frequent';
    sleepQuality?: number;
    stressLevel?: number;
    mealPreference?: 'home_cooked' | 'processed' | 'mixed';

    // Medication
    onMedication: boolean;
    medicationCategory?: 'none' | 'insulin' | 'oral' | 'other';
    medicationFrequency?: 'daily' | 'occasionally' | 'none';

    // Metadata
    lastPromptShown?: Date;
    promptsDismissed: number;
    profileCompleteness: number;

    createdAt: Date;
    updatedAt: Date;
}

const UserHealthProfileSchema = new Schema<IUserHealthProfile>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        firebaseUid: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        // Lifestyle
        activityLevel: {
            type: String,
            enum: ['low', 'medium', 'high'],
        },
        exerciseFrequency: {
            type: String,
            enum: ['rare', 'moderate', 'frequent'],
        },
        sleepQuality: {
            type: Number,
            min: 1,
            max: 5,
        },
        stressLevel: {
            type: Number,
            min: 1,
            max: 5,
        },
        mealPreference: {
            type: String,
            enum: ['home_cooked', 'processed', 'mixed'],
        },

        // Medication
        onMedication: {
            type: Boolean,
            default: false,
        },
        medicationCategory: {
            type: String,
            enum: ['none', 'insulin', 'oral', 'other'],
            default: 'none',
        },
        medicationFrequency: {
            type: String,
            enum: ['daily', 'occasionally', 'none'],
            default: 'none',
        },

        // Metadata
        lastPromptShown: {
            type: Date,
        },
        promptsDismissed: {
            type: Number,
            default: 0,
        },
        profileCompleteness: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
    },
    {
        timestamps: true,
    }
);

export const UserHealthProfile = mongoose.model<IUserHealthProfile>(
    'UserHealthProfile',
    UserHealthProfileSchema
);
export default UserHealthProfile;
