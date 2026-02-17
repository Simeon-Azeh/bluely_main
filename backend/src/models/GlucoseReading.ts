import mongoose, { Schema, Document } from 'mongoose';

export interface IGlucoseReading extends Document {
    userId: mongoose.Types.ObjectId;
    firebaseUid: string;
    value: number;
    unit: 'mg/dL' | 'mmol/L';
    readingType: 'fasting' | 'before_meal' | 'after_meal' | 'bedtime' | 'random' | 'other';
    mealContext?: string;
    activityContext?: string;
    notes?: string;

    // Medication tracking when logging glucose
    medicationTaken?: boolean;
    medicationName?: string;
    medicationType?: string;
    medicationDose?: number;
    medicationDoseUnit?: string;
    injectionSite?: string;

    recordedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const GlucoseReadingSchema = new Schema<IGlucoseReading>(
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
        value: {
            type: Number,
            required: true,
            min: 20,
            max: 600,
        },
        unit: {
            type: String,
            enum: ['mg/dL', 'mmol/L'],
            default: 'mg/dL',
        },
        readingType: {
            type: String,
            enum: ['fasting', 'before_meal', 'after_meal', 'bedtime', 'random', 'other'],
            default: 'random',
        },
        mealContext: {
            type: String,
            maxlength: 200,
            trim: true,
        },
        activityContext: {
            type: String,
            maxlength: 200,
            trim: true,
        },
        notes: {
            type: String,
            maxlength: 500,
            trim: true,
        },
        medicationTaken: {
            type: Boolean,
        },
        medicationName: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        medicationType: {
            type: String,
            trim: true,
        },
        medicationDose: {
            type: Number,
            min: 0,
        },
        medicationDoseUnit: {
            type: String,
            enum: ['units', 'mg', 'mcg', 'ml'],
        },
        injectionSite: {
            type: String,
            enum: [
                'abdomen_left', 'abdomen_right',
                'thigh_left', 'thigh_right',
                'arm_left', 'arm_right',
                'buttock_left', 'buttock_right',
            ],
        },
        recordedAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient querying
GlucoseReadingSchema.index({ firebaseUid: 1, recordedAt: -1 });

export const GlucoseReading = mongoose.model<IGlucoseReading>('GlucoseReading', GlucoseReadingSchema);
export default GlucoseReading;
