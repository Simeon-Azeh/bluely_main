import mongoose, { Schema, Document } from 'mongoose';

export interface IPredictionAnalysis extends Document {
    userId: mongoose.Types.ObjectId;
    firebaseUid: string;
    predictedGlucose: number;
    riskLevel: 'normal' | 'elevated' | 'critical';
    confidence: number;
    features: Record<string, unknown>;
    modelVersion: string;
    recommendation?: string;
    createdAt: Date;
}

const PredictionAnalysisSchema = new Schema<IPredictionAnalysis>(
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
        riskLevel: {
            type: String,
            enum: ['normal', 'elevated', 'critical'],
            required: true,
        },
        confidence: {
            type: Number,
            min: 0,
            max: 1,
        },
        features: {
            type: Schema.Types.Mixed,
        },
        modelVersion: {
            type: String,
            default: 'v1.0',
        },
        recommendation: {
            type: String,
            maxlength: 500,
        },
    },
    {
        timestamps: true,
    }
);

PredictionAnalysisSchema.index({ firebaseUid: 1, createdAt: -1 });

export const PredictionAnalysis = mongoose.model<IPredictionAnalysis>(
    'PredictionAnalysis',
    PredictionAnalysisSchema
);
export default PredictionAnalysis;
