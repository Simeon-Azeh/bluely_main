import mongoose, { Schema, Document } from 'mongoose';

export interface IForecastLog extends Document {
    userId: mongoose.Types.ObjectId;
    firebaseUid: string;
    predictedGlucose: number;
    direction: string;
    directionArrow: string;
    directionLabel: string;
    confidence: number;
    timeframe: string;
    recommendation: string;
    riskAlert?: string | null;
    factors: string[];
    modelUsed: string;
    currentGlucose: number;
    triggerEvent: 'glucose_log' | 'meal_log' | 'activity_log' | 'medication_log' | 'manual' | 'auto';
    actualGlucose?: number;
    actualLoggedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ForecastLogSchema = new Schema<IForecastLog>(
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
        predictedGlucose: {
            type: Number,
            required: true,
        },
        direction: {
            type: String,
            enum: ['rising', 'stable', 'dropping'],
            required: true,
        },
        directionArrow: {
            type: String,
            required: true,
        },
        directionLabel: {
            type: String,
            required: true,
        },
        confidence: {
            type: Number,
            required: true,
            min: 0,
            max: 1,
        },
        timeframe: {
            type: String,
            default: '30 minutes',
        },
        recommendation: {
            type: String,
            maxlength: 500,
        },
        riskAlert: {
            type: String,
            default: null,
        },
        factors: [{
            type: String,
        }],
        modelUsed: {
            type: String,
            required: true,
        },
        currentGlucose: {
            type: Number,
            required: true,
        },
        triggerEvent: {
            type: String,
            enum: ['glucose_log', 'meal_log', 'activity_log', 'medication_log', 'manual', 'auto'],
            default: 'auto',
        },
        actualGlucose: {
            type: Number,
        },
        actualLoggedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

ForecastLogSchema.index({ firebaseUid: 1, createdAt: -1 });

export const ForecastLog = mongoose.model<IForecastLog>('ForecastLog', ForecastLogSchema);
export default ForecastLog;
