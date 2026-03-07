import mongoose, { Schema, Document } from 'mongoose';

export interface IPatientModelProfile extends Document {
    userId: mongoose.Types.ObjectId;
    firebaseUid: string;
    trainingSamples: number;
    isPersonalized: boolean;
    baselineGlucoseBias: number;
    insulinSensitivityFactor: number;
    carbResponseFactor: number;
    activityResponseFactor: number;
    ewmaResidual: number;
    lastPredictionAccuracy: number | null;
    lastUpdated: Date;
    createdAt: Date;
    updatedAt: Date;
}

const PatientModelProfileSchema = new Schema<IPatientModelProfile>(
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
            unique: true,
            index: true,
        },
        trainingSamples: {
            type: Number,
            default: 0,
        },
        isPersonalized: {
            type: Boolean,
            default: false,
        },
        baselineGlucoseBias: {
            type: Number,
            default: 0,
        },
        insulinSensitivityFactor: {
            type: Number,
            default: 1.0,
        },
        carbResponseFactor: {
            type: Number,
            default: 1.0,
        },
        activityResponseFactor: {
            type: Number,
            default: 1.0,
        },
        ewmaResidual: {
            type: Number,
            default: 0,
        },
        lastPredictionAccuracy: {
            type: Number,
            default: null,
        },
        lastUpdated: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

export const PatientModelProfile = mongoose.model<IPatientModelProfile>(
    'PatientModelProfile',
    PatientModelProfileSchema
);
