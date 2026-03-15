/**
 * Prediction Safety Service
 * ═══════════════════════════════════════════════════════════════════════════════
 * Validates input completeness before glucose predictions are generated.
 *
 * Enforces strict data requirements:
 *   • Recent glucose (≤10 minutes old)
 *   • Recent meal data (≤4 hours)
 *   • Recent medication (≤6 hours)
 *   • Recent activity (≤6 hours)
 *   • Wellness context (mood + lifestyle)
 *   • Glucose history (≥3 readings for trend analysis)
 *
 * This service prevents predictions from running with incomplete information,
 * ensuring medical accuracy and user safety.
 */

import {
    User,
    GlucoseReading,
    Meal,
    Activity,
    MedicationLog,
    MoodLog,
    LifestyleLog,
} from '../models';

// ── Types ───────────────────────────────────────────────────────────────────

export interface MissingInputField {
    field: string;  // 'glucose', 'meal', 'medication', 'activity', 'wellness', 'history'
    label: string;  // Human-readable name
    reason: string; // Why this data matters physiologically
    href: string;   // Where to log it (frontend route)
    icon: string;   // UI icon hint (e.g., 'glucose', 'meal', 'medication')
    importance: 'critical' | 'high' | 'medium';
}

export interface SafetyWarning {
    type: string;   // 'stale_glucose', 'incomplete_history', etc.
    message: string;
    severity: 'warn' | 'error';
}

export interface PredictionContext {
    meal: { carbsEstimate: number; mealType: string; minutesSinceMeal: number } | null;
    medication: { dose: number; medicationType: string; minutesSinceTaken: number } | null;
    activity: { intensity: string; durationMinutes: number; minutesSinceActivity: number } | null;
    wellness: { sleepQuality: number; stressLevel: number; mood: string } | null;
    glucoseHistory: number[];
    currentGlucose: number;
    diabetesType: string;
}

export interface CachedContextEntry {
    meal: { carbsEstimate: number; mealType: string; minutesAgo: number; timestamp: string } | null;
    medication: { dose: number; medicationType: string; medicationName: string; minutesAgo: number; takenAt: string } | null;
    activity: { intensity: string; durationMinutes: number; minutesAgo: number; timestamp: string } | null;
    wellness: { sleepQuality: number; stressLevel: number; mood: string; minutesAgo: number } | null;
}

export interface SafetyCheckResult {
    canPredict: boolean;        // Whether prediction is safe to generate
    isComplete: boolean;        // Whether all required inputs are present
    missingInputs: MissingInputField[];
    warnings: SafetyWarning[];
    context: PredictionContext | null;
    glucoseIsStale: boolean;
    cachedContext: CachedContextEntry | null;
}

// ── Main Service ────────────────────────────────────────────────────────────

export class PredictionSafetyService {
    /**
     * Perform comprehensive safety check before glucose prediction.
     * Returns detailed information about what's missing and why it matters.
     */
    static async check(firebaseUid: string): Promise<SafetyCheckResult> {
        try {
            // Gather all required data in parallel
            const now = Date.now();
            const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
            const fourHoursAgo = new Date(now - 4 * 60 * 60 * 1000);
            const sixHoursAgo = new Date(now - 6 * 60 * 60 * 1000);

            const [
                user,
                allReadings,
                recentMeal,
                recentMedication,
                recentActivity,
                recentMood,
                recentLifestyle,
            ] = await Promise.all([
                User.findOne({ firebaseUid }),
                GlucoseReading.find({ firebaseUid }).sort({ recordedAt: -1 }).limit(20),
                Meal.findOne({ firebaseUid, timestamp: { $gte: fourHoursAgo } }).sort({
                    timestamp: -1,
                }),
                MedicationLog.findOne({ firebaseUid, takenAt: { $gte: sixHoursAgo } }).sort({
                    takenAt: -1,
                }),
                Activity.findOne({ firebaseUid, timestamp: { $gte: sixHoursAgo } }).sort({
                    timestamp: -1,
                }),
                MoodLog.findOne({ firebaseUid }).sort({ createdAt: -1 }),
                LifestyleLog.findOne({ firebaseUid }).sort({ createdAt: -1 }),
            ]);

            let glucoseIsStale = false;
            const missingInputs: MissingInputField[] = [];
            const warnings: SafetyWarning[] = [];
            let context: PredictionContext | null = null;

            // ── Glucose Check ───────────────────────────────────────────────

            let currentGlucose = 0;
            let glucoseHistory: number[] = [];

            if (!allReadings || allReadings.length === 0) {
                missingInputs.push({
                    field: 'glucose',
                    label: 'Recent Glucose Reading',
                    reason:
                        'We need your current glucose level to predict what happens next. ' +
                        'This is the foundation for all other predictions.',
                    href: '/glucose',
                    icon: 'glucose',
                    importance: 'critical',
                });
            } else {
                const mostRecent = allReadings[0];
                const minutesSinceReading = Math.round((now - new Date(mostRecent.recordedAt).getTime()) / 60000);

                currentGlucose = mostRecent.value;

                // Check if glucose is recent enough (≤10 minutes)
                if (minutesSinceReading > 10) {
                    const hoursOld = Math.round(minutesSinceReading / 60 * 10) / 10; // Round to 1 decimal
                    const timeStr = hoursOld < 1 ? `${minutesSinceReading} minutes` : `${hoursOld} hours`;
                    missingInputs.push({
                        field: 'glucose',
                        label: 'Recent Glucose Reading',
                        reason:
                            `Your last glucose reading is ${timeStr} old. ` +
                            'For accurate predictions, we need a fresh reading (within 10 minutes).',
                        href: '/glucose',
                        icon: 'glucose',
                        importance: 'critical',
                    });
                    glucoseIsStale = true;
                }

                // Build glucose history (at least 3 readings for trends)
                glucoseHistory = allReadings.length > 1
                    ? allReadings.slice(1).reverse().map(r => r.value)
                    : [];

                if (glucoseHistory.length < 3) {
                    missingInputs.push({
                        field: 'glucoseHistory',
                        label: 'Previous Glucose Readings',
                        reason:
                            'At least 3 prior readings are needed to calculate glucose trends and variability. ' +
                            'This helps us predict direction and rate of change.',
                        href: '/glucose',
                        icon: 'history',
                        importance: 'high',
                    });
                }
            }

            // ── Meal Check ──────────────────────────────────────────────────

            let mealContext: PredictionContext['meal'] = null;

            if (!recentMeal) {
                missingInputs.push({
                    field: 'meal',
                    label: 'Last Meal',
                    reason: 'Carbohydrate intake directly affects blood glucose. Without knowing your last meal, ' +
                        'we cannot predict post-meal spikes or fasting drops. This is critical for accuracy.',
                    href: '/meals',
                    icon: 'meal',
                    importance: 'critical',
                });
            } else {
                const minutesSinceMeal = Math.round(
                    (now - new Date(recentMeal.timestamp).getTime()) / 60000
                );

                if (!recentMeal.carbsEstimate) {
                    missingInputs.push({
                        field: 'mealCarbs',
                        label: 'Carbohydrates from Last Meal',
                        reason:
                            'The carb amount in your meal is the primary driver of glucose rise. ' +
                            'Without this, the prediction cannot estimate meal impact.',
                        href: '/meals',
                        icon: 'meal',
                        importance: 'critical',
                    });
                } else {
                    mealContext = {
                        carbsEstimate: recentMeal.carbsEstimate,
                        mealType: recentMeal.mealType || 'snack',
                        minutesSinceMeal,
                    };
                }
            }

            // ── Medication Check ────────────────────────────────────────────

            let medContext: PredictionContext['medication'] = null;

            if (!recentMedication) {
                missingInputs.push({
                    field: 'medication',
                    label: 'Recent Medication/Insulin',
                    reason: 'Insulin and medications significantly lower blood glucose. Missing this data ' +
                        'could lead to dangerously high or unrealistically low predictions.',
                    href: '/medications',
                    icon: 'medication',
                    importance: 'critical',
                });
            } else {
                medContext = {
                    dose: recentMedication.dosage || 0,
                    medicationType: recentMedication.medicationType || 'other',
                    minutesSinceTaken: Math.round(
                        (now - new Date(recentMedication.takenAt).getTime()) / 60000
                    ),
                };
            }

            // ── Activity Check ──────────────────────────────────────────────

            let activityContext: PredictionContext['activity'] = null;

            if (!recentActivity) {
                missingInputs.push({
                    field: 'activity',
                    label: 'Recent Physical Activity',
                    reason: 'Exercise lowers glucose during and after activity. Even logging "no activity" helps ' +
                        'distinguish sedentary periods from active ones. This improves prediction accuracy.',
                    href: '/glucose',
                    icon: 'activity',
                    importance: 'high',
                });
            } else {
                activityContext = {
                    intensity: recentActivity.activityLevel || 'low',
                    durationMinutes: recentActivity.durationMinutes || 30,
                    minutesSinceActivity: Math.round(
                        (now - new Date(recentActivity.timestamp).getTime()) / 60000
                    ),
                };
            }

            // ── Wellness Check ──────────────────────────────────────────────

            let wellnessContext: PredictionContext['wellness'] = null;

            if (!recentMood && !recentLifestyle) {
                missingInputs.push({
                    field: 'wellness',
                    label: 'Mood & Sleep Quality',
                    reason: 'Sleep quality and stress levels affect insulin resistance through hormonal pathways ' +
                        '(cortisol, growth hormone). This data significantly improves prediction accuracy.',
                    href: '/settings',
                    icon: 'wellness',
                    importance: 'high',
                });
            } else {
                wellnessContext = {
                    sleepQuality: recentLifestyle?.sleepQuality ?? 3,
                    stressLevel: recentLifestyle?.stressLevel ?? 3,
                    mood: recentMood?.mood ?? 'Okay',
                };
            }

            // ── Build Context ───────────────────────────────────────────────

            if (currentGlucose > 0 && glucoseHistory.length >= 3 && mealContext && medContext && activityContext && wellnessContext) {
                context = {
                    meal: mealContext,
                    medication: medContext,
                    activity: activityContext,
                    wellness: wellnessContext,
                    glucoseHistory,
                    currentGlucose,
                    diabetesType: user?.diabetesType || 'type2',
                };
            }

            // ── Cached Context (for stale-glucose UX) ──────────────────────

            const cachedContext: CachedContextEntry | null = glucoseIsStale ? {
                meal: recentMeal ? {
                    carbsEstimate: recentMeal.carbsEstimate || 0,
                    mealType: recentMeal.mealType || 'snack',
                    minutesAgo: Math.round((now - new Date(recentMeal.timestamp).getTime()) / 60000),
                    timestamp: new Date(recentMeal.timestamp).toISOString(),
                } : null,
                medication: recentMedication ? {
                    dose: recentMedication.dosage || 0,
                    medicationType: recentMedication.medicationType || 'other',
                    medicationName: recentMedication.medicationName || recentMedication.medicationType || 'Medication',
                    minutesAgo: Math.round((now - new Date(recentMedication.takenAt).getTime()) / 60000),
                    takenAt: new Date(recentMedication.takenAt).toISOString(),
                } : null,
                activity: recentActivity ? {
                    intensity: recentActivity.activityLevel || 'low',
                    durationMinutes: recentActivity.durationMinutes || 30,
                    minutesAgo: Math.round((now - new Date(recentActivity.timestamp).getTime()) / 60000),
                    timestamp: new Date(recentActivity.timestamp).toISOString(),
                } : null,
                wellness: (recentMood || recentLifestyle) ? {
                    sleepQuality: recentLifestyle?.sleepQuality ?? 3,
                    stressLevel: recentLifestyle?.stressLevel ?? 3,
                    mood: recentMood?.mood ?? 'Okay',
                    minutesAgo: recentMood
                        ? Math.round((now - new Date(recentMood.createdAt).getTime()) / 60000)
                        : (recentLifestyle ? Math.round((now - new Date(recentLifestyle.createdAt).getTime()) / 60000) : 0),
                } : null,
            } : null;

            // ── Determine Result ────────────────────────────────────────────

            const isComplete = missingInputs.length === 0;
            const canPredict = isComplete && warnings.filter(w => w.severity === 'error').length === 0;

            return {
                canPredict,
                isComplete,
                missingInputs,
                warnings,
                context: isComplete ? context : null,
                glucoseIsStale,
                cachedContext,
            };
        } catch (error) {
            console.error('Error in PredictionSafety.check():', error);
            return {
                canPredict: false,
                isComplete: false,
                missingInputs: [
                    {
                        field: 'system',
                        label: 'System Error',
                        reason: 'Unable to check safety status. Please try again.',
                        href: '/dashboard',
                        icon: 'error',
                        importance: 'critical',
                    },
                ],
                warnings: [
                    {
                        type: 'system_error',
                        message: 'Safety check failed. Please refresh and try again.',
                        severity: 'error',
                    },
                ],
                context: null,
                glucoseIsStale: false,
                cachedContext: null,
            };
        }
    }

    /**
     * Check if a specific input field is missing/stale.
     * Useful for progressive validation (e.g., as user logs data).
     */
    static async checkField(
        firebaseUid: string,
        field: 'glucose' | 'meal' | 'medication' | 'activity' | 'wellness'
    ): Promise<boolean> {
        const result = await this.check(firebaseUid);
        return !result.missingInputs.some(m => m.field === field);
    }

    /**
     * Get human-readable summary of missing inputs.
     */
    static getMissingSummary(missingInputs: MissingInputField[]): string {
        if (missingInputs.length === 0) return '';

        const labels = missingInputs.map(m => m.label).join(', ');
        return `Missing: ${labels}`;
    }
}

export default PredictionSafetyService;
