import mongoose, { Schema, Document } from 'mongoose';

export interface IMeal extends Document {
    userId: mongoose.Types.ObjectId;
    firebaseUid: string;
    carbsEstimate?: number;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    mealCategory?: 'home_cooked' | 'processed' | 'restaurant' | 'other';
    description?: string;
    timestamp: Date;
    createdAt: Date;
    updatedAt: Date;
}

const MealSchema = new Schema<IMeal>(
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
        carbsEstimate: {
            type: Number,
            min: 0,
            max: 500,
        },
        mealType: {
            type: String,
            enum: ['breakfast', 'lunch', 'dinner', 'snack'],
            required: true,
        },
        mealCategory: {
            type: String,
            enum: ['home_cooked', 'processed', 'restaurant', 'other'],
            default: 'other',
        },
        description: {
            type: String,
            maxlength: 300,
            trim: true,
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

MealSchema.index({ firebaseUid: 1, timestamp: -1 });

export const Meal = mongoose.model<IMeal>('Meal', MealSchema);
export default Meal;
