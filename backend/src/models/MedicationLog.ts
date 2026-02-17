import mongoose, { Schema, Document } from 'mongoose';

export interface IMedicationLog extends Document {
    userId: mongoose.Types.ObjectId;
    firebaseUid: string;
    medicationName: string;
    medicationType: string;
    dosage: number;
    doseUnit: string;
    injectionSite?: string;
    glucoseReadingId?: mongoose.Types.ObjectId;
    takenAt: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const MedicationLogSchema = new Schema<IMedicationLog>(
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
        },
        medicationType: {
            type: String,
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
        },
        injectionSite: {
            type: String,
            enum: ['abdomen', 'thigh_left', 'thigh_right', 'arm_left', 'arm_right', 'buttock'],
        },
        glucoseReadingId: {
            type: Schema.Types.ObjectId,
            ref: 'GlucoseReading',
        },
        takenAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
        notes: {
            type: String,
            trim: true,
            maxlength: 300,
        },
    },
    {
        timestamps: true,
    }
);

MedicationLogSchema.index({ firebaseUid: 1, takenAt: -1 });
MedicationLogSchema.index({ firebaseUid: 1, injectionSite: 1, takenAt: -1 });

export const MedicationLog = mongoose.model<IMedicationLog>('MedicationLog', MedicationLogSchema);
export default MedicationLog;
