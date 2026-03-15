/**
 * Input Validation Middleware
 * ═══════════════════════════════════════════════════════════════════════════════
 * Validates all incoming data against database schema requirements.
 * Provides field-level error messages for invalid inputs.
 */

import { Request, Response, NextFunction } from 'express';

// ── Validation Rules ────────────────────────────────────────────────────────

export enum ValidationScope {
    GLUCOSE = 'glucose',
    MEAL = 'meal',
    MEDICATION = 'medication',
    ACTIVITY = 'activity',
    MOOD = 'mood',
    LIFESTYLE = 'lifestyle',
}

interface ValidationError {
    field: string;
    message: string;
    value: unknown;
}

// ── Validators ──────────────────────────────────────────────────────────────

export class DataValidator {
    /**
     * Validate glucose reading value.
     */
    static validateGlucoseValue(value: unknown): { valid: boolean; error?: string } {
        if (value === undefined || value === null) {
            return { valid: false, error: 'Glucose value is required' };
        }

        const num = Number(value);

        if (isNaN(num)) {
            return { valid: false, error: 'Glucose value must be a number' };
        }

        if (num < 20 || num > 600) {
            return { valid: false, error: 'Glucose must be between 20 and 600 mg/dL' };
        }

        return { valid: true };
    }

    /**
     * Validate glucose unit.
     */
    static validateGlucoseUnit(unit: unknown): { valid: boolean; error?: string } {
        const validUnits = ['mg/dL', 'mmol/L'];

        if (!validUnits.includes(String(unit))) {
            return { valid: false, error: `Unit must be one of: ${validUnits.join(', ')}` };
        }

        return { valid: true };
    }

    /**
     * Validate reading type.
     */
    static validateReadingType(type: unknown): { valid: boolean; error?: string } {
        const validTypes = ['fasting', 'before_meal', 'after_meal', 'bedtime', 'random', 'other'];

        if (type && !validTypes.includes(String(type))) {
            return { valid: false, error: `Reading type must be one of: ${validTypes.join(', ')}` };
        }

        return { valid: true };
    }

    /**
     * Validate carbohydrate estimate.
     */
    static validateCarbsEstimate(carbs: unknown): { valid: boolean; error?: string } {
        if (carbs === undefined || carbs === null) {
            return { valid: false, error: 'Carbohydrate estimate is required' };
        }

        const num = Number(carbs);

        if (isNaN(num)) {
            return { valid: false, error: 'Carbohydrate estimate must be a number' };
        }

        if (num < 0 || num > 500) {
            return { valid: false, error: 'Carbohydrate estimate must be between 0 and 500 grams' };
        }

        return { valid: true };
    }

    /**
     * Validate meal type.
     */
    static validateMealType(type: unknown): { valid: boolean; error?: string } {
        const validTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

        if (!validTypes.includes(String(type))) {
            return { valid: false, error: `Meal type must be one of: ${validTypes.join(', ')}` };
        }

        return { valid: true };
    }

    /**
     * Validate medication dose.
     */
    static validateMedicationDose(dose: unknown): { valid: boolean; error?: string } {
        if (dose === undefined || dose === null) {
            return { valid: false, error: 'Medication dose is required' };
        }

        const num = Number(dose);

        if (isNaN(num)) {
            return { valid: false, error: 'Medication dose must be a number' };
        }

        if (num < 0) {
            return { valid: false, error: 'Medication dose must be non-negative' };
        }

        return { valid: true };
    }

    /**
     * Validate medication type.
     */
    static validateMedicationType(type: unknown): { valid: boolean; error?: string } {
        const validTypes = [
            'insulin_rapid',
            'insulin_long',
            'insulin_mixed',
            'metformin',
            'sulfonylurea',
            'other',
        ];

        if (!validTypes.includes(String(type))) {
            return {
                valid: false,
                error: `Medication type must be one of: ${validTypes.join(', ')}`,
            };
        }

        return { valid: true };
    }

    /**
     * Validate activity level.
     */
    static validateActivityLevel(level: unknown): { valid: boolean; error?: string } {
        const validLevels = ['low', 'medium', 'high'];

        if (!validLevels.includes(String(level))) {
            return { valid: false, error: `Activity level must be one of: ${validLevels.join(', ')}` };
        }

        return { valid: true };
    }

    /**
     * Validate activity duration.
     */
    static validateActivityDuration(duration: unknown): { valid: boolean; error?: string } {
        if (duration === undefined || duration === null) {
            return { valid: false, error: 'Activity duration is required' };
        }

        const num = Number(duration);

        if (isNaN(num)) {
            return { valid: false, error: 'Activity duration must be a number' };
        }

        if (num < 1 || num > 480) {
            return { valid: false, error: 'Activity duration must be between 1 and 480 minutes' };
        }

        return { valid: true };
    }

    /**
     * Validate mood value.
     */
    static validateMood(mood: unknown): { valid: boolean; error?: string } {
        const validMoods = ['Great', 'Good', 'Okay', 'Low', 'Rough'];

        if (!validMoods.includes(String(mood))) {
            return { valid: false, error: `Mood must be one of: ${validMoods.join(', ')}` };
        }

        return { valid: true };
    }

    /**
     * Validate scale value (1-5).
     */
    static validateScale(value: unknown, fieldName: string): { valid: boolean; error?: string } {
        const num = Number(value);

        if (isNaN(num)) {
            return { valid: false, error: `${fieldName} must be a number` };
        }

        if (num < 1 || num > 5) {
            return { valid: false, error: `${fieldName} must be between 1 and 5` };
        }

        return { valid: true };
    }

    /**
     * Validate diabetes type.
     */
    static validateDiabetesType(type: unknown): { valid: boolean; error?: string } {
        const validTypes = ['type1', 'type2', 'gestational', 'prediabetes', 'other'];

        if (!validTypes.includes(String(type))) {
            return {
                valid: false,
                error: `Diabetes type must be one of: ${validTypes.join(', ')}`,
            };
        }

        return { valid: true };
    }
}

// ── Middleware Functions ────────────────────────────────────────────────────

/**
 * Middleware: Validate glucose reading data.
 */
export const validateGlucoseInput = (req: Request, res: Response, next: NextFunction): void => {
    const { value, unit, readingType } = req.body;
    const errors: ValidationError[] = [];

    // Validate glucose value
    const glucoseValidation = DataValidator.validateGlucoseValue(value);
    if (!glucoseValidation.valid) {
        errors.push({
            field: 'value',
            message: glucoseValidation.error || 'Invalid glucose value',
            value,
        });
    }

    // Validate unit if provided
    if (unit) {
        const unitValidation = DataValidator.validateGlucoseUnit(unit);
        if (!unitValidation.valid) {
            errors.push({
                field: 'unit',
                message: unitValidation.error || 'Invalid unit',
                value: unit,
            });
        }
    }

    // Validate reading type if provided
    if (readingType) {
        const typeValidation = DataValidator.validateReadingType(readingType);
        if (!typeValidation.valid) {
            errors.push({
                field: 'readingType',
                message: typeValidation.error || 'Invalid reading type',
                value: readingType,
            });
        }
    }

    if (errors.length > 0) {
        res.status(400).json({
            error: 'validation_error',
            message: 'Glucose reading data is invalid',
            errors,
        });
        return;
    }

    next();
};

/**
 * Middleware: Validate meal data.
 */
export const validateMealInput = (req: Request, res: Response, next: NextFunction): void => {
    const { carbsEstimate, mealType } = req.body;
    const errors: ValidationError[] = [];

    // Validate carbs
    const carbsValidation = DataValidator.validateCarbsEstimate(carbsEstimate);
    if (!carbsValidation.valid) {
        errors.push({
            field: 'carbsEstimate',
            message: carbsValidation.error || 'Invalid carbs estimate',
            value: carbsEstimate,
        });
    }

    // Validate meal type
    const typeValidation = DataValidator.validateMealType(mealType);
    if (!typeValidation.valid) {
        errors.push({
            field: 'mealType',
            message: typeValidation.error || 'Invalid meal type',
            value: mealType,
        });
    }

    if (errors.length > 0) {
        res.status(400).json({
            error: 'validation_error',
            message: 'Meal data is invalid',
            errors,
        });
        return;
    }

    next();
};

/**
 * Middleware: Validate medication data.
 */
export const validateMedicationInput = (req: Request, res: Response, next: NextFunction): void => {
    const { dose, medicationType } = req.body;
    const errors: ValidationError[] = [];

    // Validate dose
    const doseValidation = DataValidator.validateMedicationDose(dose);
    if (!doseValidation.valid) {
        errors.push({
            field: 'dose',
            message: doseValidation.error || 'Invalid dose',
            value: dose,
        });
    }

    // Validate medication type
    const typeValidation = DataValidator.validateMedicationType(medicationType);
    if (!typeValidation.valid) {
        errors.push({
            field: 'medicationType',
            message: typeValidation.error || 'Invalid medication type',
            value: medicationType,
        });
    }

    if (errors.length > 0) {
        res.status(400).json({
            error: 'validation_error',
            message: 'Medication data is invalid',
            errors,
        });
        return;
    }

    next();
};

/**
 * Middleware: Validate activity data.
 */
export const validateActivityInput = (req: Request, res: Response, next: NextFunction): void => {
    const { activityLevel, durationMinutes } = req.body;
    const errors: ValidationError[] = [];

    // Validate activity level
    const levelValidation = DataValidator.validateActivityLevel(activityLevel);
    if (!levelValidation.valid) {
        errors.push({
            field: 'activityLevel',
            message: levelValidation.error || 'Invalid activity level',
            value: activityLevel,
        });
    }

    // Validate duration if provided
    if (durationMinutes !== undefined) {
        const durationValidation = DataValidator.validateActivityDuration(durationMinutes);
        if (!durationValidation.valid) {
            errors.push({
                field: 'durationMinutes',
                message: durationValidation.error || 'Invalid duration',
                value: durationMinutes,
            });
        }
    }

    if (errors.length > 0) {
        res.status(400).json({
            error: 'validation_error',
            message: 'Activity data is invalid',
            errors,
        });
        return;
    }

    next();
};

/**
 * Generic validation middleware for quick-log endpoint.
 * Validates only the fields that are provided.
 */
export const validateQuickLogInput = (req: Request, res: Response, next: NextFunction): void => {
    const { glucose, meal, medication, activity } = req.body;
    const errors: ValidationError[] = [];

    // Validate glucose if provided
    if (glucose) {
        const glucoseValidation = DataValidator.validateGlucoseValue(glucose.value);
        if (!glucoseValidation.valid) {
            errors.push({
                field: 'glucose.value',
                message: glucoseValidation.error || 'Invalid glucose value',
                value: glucose.value,
            });
        }
    }

    // Validate meal if provided
    if (meal) {
        if (meal.carbsEstimate !== undefined) {
            const carbsValidation = DataValidator.validateCarbsEstimate(meal.carbsEstimate);
            if (!carbsValidation.valid) {
                errors.push({
                    field: 'meal.carbsEstimate',
                    message: carbsValidation.error || 'Invalid carbs',
                    value: meal.carbsEstimate,
                });
            }
        }

        if (meal.mealType) {
            const typeValidation = DataValidator.validateMealType(meal.mealType);
            if (!typeValidation.valid) {
                errors.push({
                    field: 'meal.mealType',
                    message: typeValidation.error || 'Invalid meal type',
                    value: meal.mealType,
                });
            }
        }
    }

    // Validate medication if provided
    if (medication) {
        if (medication.dose !== undefined) {
            const doseValidation = DataValidator.validateMedicationDose(medication.dose);
            if (!doseValidation.valid) {
                errors.push({
                    field: 'medication.dose',
                    message: doseValidation.error || 'Invalid dose',
                    value: medication.dose,
                });
            }
        }

        if (medication.medicationType) {
            const typeValidation = DataValidator.validateMedicationType(medication.medicationType);
            if (!typeValidation.valid) {
                errors.push({
                    field: 'medication.medicationType',
                    message: typeValidation.error || 'Invalid medication type',
                    value: medication.medicationType,
                });
            }
        }
    }

    // Validate activity if provided
    if (activity) {
        if (activity.activityLevel) {
            const levelValidation = DataValidator.validateActivityLevel(activity.activityLevel);
            if (!levelValidation.valid) {
                errors.push({
                    field: 'activity.activityLevel',
                    message: levelValidation.error || 'Invalid activity level',
                    value: activity.activityLevel,
                });
            }
        }
    }

    if (errors.length > 0) {
        res.status(400).json({
            error: 'validation_error',
            message: 'One or more fields contain invalid data',
            errors,
        });
        return;
    }

    next();
};

export default {
    DataValidator,
    validateGlucoseInput,
    validateMealInput,
    validateMedicationInput,
    validateActivityInput,
    validateQuickLogInput,
};
