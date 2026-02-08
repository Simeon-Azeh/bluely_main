import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    firebaseUid: string;
    email: string;
    displayName: string;
    dateOfBirth?: Date;
    diabetesType?: 'type1' | 'type2' | 'gestational' | 'prediabetes' | 'other';
    diagnosisYear?: number;
    targetGlucoseMin: number;
    targetGlucoseMax: number;
    preferredUnit: 'mg/dL' | 'mmol/L';
    onboardingCompleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        firebaseUid: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        displayName: {
            type: String,
            required: true,
            trim: true,
        },
        dateOfBirth: {
            type: Date,
        },
        diabetesType: {
            type: String,
            enum: ['type1', 'type2', 'gestational', 'prediabetes', 'other'],
        },
        diagnosisYear: {
            type: Number,
            min: 1900,
            max: new Date().getFullYear(),
        },
        targetGlucoseMin: {
            type: Number,
            default: 70,
            min: 40,
            max: 200,
        },
        targetGlucoseMax: {
            type: Number,
            default: 180,
            min: 100,
            max: 400,
        },
        preferredUnit: {
            type: String,
            enum: ['mg/dL', 'mmol/L'],
            default: 'mg/dL',
        },
        onboardingCompleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

export const User = mongoose.model<IUser>('User', UserSchema);
export default User;
