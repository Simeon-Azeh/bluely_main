import mongoose, { Schema, Document } from 'mongoose';

export interface IMedication extends Document {
    userId: mongoose.Types.ObjectId;
    firebaseUid: string;
    medicationName: string;
    medicationType: 'insulin_rapid' | 'insulin_long' | 'insulin_mixed' | 'metformin' | 'sulfonylurea' | 'other';
    dosage: number;
    doseUnit: string;
    frequency: 'once_daily' | 'twice_daily' | 'three_daily' | 'before_meals' | 'after_meals' | 'at_bedtime' | 'as_needed' | 'weekly';
    isInjectable: boolean;
    isActive: boolean;
    prescribedBy?: string;
    notes?: string;
    startDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const MedicationSchema = new Schema<IMedication>(
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
        medicationName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        medicationType: {
            type: String,
            enum: ['insulin_rapid', 'insulin_long', 'insulin_mixed', 'metformin', 'sulfonylurea', 'other'],
            required: true,
        },
        dosage: {
            type: Number,
            required: true,
            min: 0,
        },
        doseUnit: {
            type: String,
            default: 'units',
            trim: true,
        },
        frequency: {
            type: String,
            enum: ['once_daily', 'twice_daily', 'three_daily', 'before_meals', 'after_meals', 'at_bedtime', 'as_needed', 'weekly'],
            default: 'once_daily',
        },
        isInjectable: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        prescribedBy: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        notes: {
            type: String,
            trim: true,
            maxlength: 300,
        },
        startDate: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

MedicationSchema.index({ firebaseUid: 1, isActive: 1 });
MedicationSchema.index({ firebaseUid: 1, createdAt: -1 });

export const Medication = mongoose.model<IMedication>('Medication', MedicationSchema);
export default Medication;
