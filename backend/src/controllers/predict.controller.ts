import { Request, Response } from 'express';
import {
    PredictionAnalysis, User, GlucoseReading, UserHealthProfile,
    Notification, ForecastLog, MedicationLog, Meal, Activity, MoodLog, LifestyleLog,
} from '../models';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

// ── ML API v3 Response Types ────────────────────────────────────────────────

interface MissingInput {
    field: string;
    label: string;
    reason: string;
    href: string;
    icon: string;
}

interface MLRiskResult {
    riskLevel: string;
    riskCode: number;
    confidence: number;
    recommendation: string;
    inputsComplete: boolean;
    missingInputs?: MissingInput[] | null;
}

interface Glucose30MLResult {
    predictedGlucose: number;
    direction: string;
    directionArrow: string;
    directionLabel: string;
    confidence: number;
    timeframe: string;
    recommendation: string;
    riskAlert: string | null;
    factors: string[];
    modelUsed: string;
    inputsComplete: boolean;
    missingInputs?: MissingInput[] | null;
}

interface HbA1cMLResult {
    estimatedHbA1c: number | null;
    averageGlucose: number | null;
    glucoseStd: number | null;
    readingCount: number;
    readingsNeeded: number;
    confidenceNote: string;
    interpretation: string | null;
}

interface WeeklyAnalysisMLResult {
    averageGlucose: number;
    glucoseStd: number;
    timeInRange: number;
    timeBelowRange: number;
    timeAboveRange: number;
    fastingAverage: number | null;
    postMealAverage: number | null;
    bestDay: string | null;
    worstDay: string | null;
    insights: string[];
}

// ── Context Gathering Helper ────────────────────────────────────────────────

interface PredictionContext {
    meal: { carbsEstimate: number; mealType: string; minutesSinceMeal: number } | null;
    medication: { dose: number; medicationType: string; minutesSinceTaken: number } | null;
    activity: { intensity: string; durationMinutes: number; minutesSinceActivity: number } | null;
    wellness: { sleepQuality: number; stressLevel: number; mood: string } | null;
    glucoseHistory: number[];
    currentGlucose: number;
    diabetesType: string;
}

async function gatherPredictionContext(firebaseUid: string): Promise<PredictionContext> {
    const now = Date.now();
    const sixHoursAgo = new Date(now - 6 * 60 * 60 * 1000);
    const fourHoursAgo = new Date(now - 4 * 60 * 60 * 1000);

    // Fetch all context in parallel
    const [user, readings, recentMeal, recentMedLog, recentActivity, recentMood, recentLifestyle] =
        await Promise.all([
            User.findOne({ firebaseUid }),
            GlucoseReading.find({ firebaseUid }).sort({ recordedAt: -1 }).limit(20),
            Meal.findOne({ firebaseUid, timestamp: { $gte: fourHoursAgo } }).sort({ timestamp: -1 }),
            MedicationLog.findOne({ firebaseUid, takenAt: { $gte: sixHoursAgo } }).sort({ takenAt: -1 }),
            Activity.findOne({ firebaseUid, timestamp: { $gte: sixHoursAgo } }).sort({ timestamp: -1 }),
            MoodLog.findOne({ firebaseUid }).sort({ createdAt: -1 }),
            LifestyleLog.findOne({ firebaseUid }).sort({ createdAt: -1 }),
        ]);

    // Current glucose
    const currentGlucose = readings.length > 0 ? readings[0].value : 0;

    // Glucose history (oldest→newest, excluding current)
    const glucoseHistory = readings.length > 1
        ? readings.slice(1).reverse().map(r => r.value)
        : [];

    // Meal context
    const meal = recentMeal ? {
        carbsEstimate: recentMeal.carbsEstimate || 0,
        mealType: recentMeal.mealType || 'snack',
        minutesSinceMeal: Math.round((now - new Date(recentMeal.timestamp).getTime()) / 60000),
    } : null;

    // Medication context
    const medication = recentMedLog ? {
        dose: recentMedLog.dosage || 0,
        medicationType: recentMedLog.medicationType || 'other',
        minutesSinceTaken: Math.round((now - new Date(recentMedLog.takenAt).getTime()) / 60000),
    } : null;

    // Activity context
    const activity = recentActivity ? {
        intensity: recentActivity.activityLevel || 'low',
        durationMinutes: recentActivity.durationMinutes || 30,
        minutesSinceActivity: Math.round((now - new Date(recentActivity.timestamp).getTime()) / 60000),
    } : null;

    // Wellness context (combine mood + lifestyle logs)
    const wellness = (recentMood || recentLifestyle) ? {
        sleepQuality: recentLifestyle?.sleepQuality ?? 3,
        stressLevel: recentLifestyle?.stressLevel ?? 3,
        mood: recentMood?.mood ?? 'Okay',
    } : null;

    // Diabetes type
    const diabetesType = user?.diabetesType || 'type2';

    return { meal, medication, activity, wellness, glucoseHistory, currentGlucose, diabetesType };
}

// Request a risk prediction from the ML service (v3 — requires full context)
export const getPrediction = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firebaseUid } = req.body;

        if (!firebaseUid) {
            res.status(400).json({ error: 'firebaseUid is required' });
            return;
        }

        const user = await User.findOne({ firebaseUid });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Gather all context the ML model needs
        const ctx = await gatherPredictionContext(firebaseUid);

        if (ctx.currentGlucose === 0) {
            res.status(400).json({ error: 'No glucose readings found. Log a reading first.' });
            return;
        }

        // Build ML API v3 payload
        const payload = {
            currentGlucose: ctx.currentGlucose,
            diabetesType: ctx.diabetesType,
            meal: ctx.meal,
            medication: ctx.medication,
            activity: ctx.activity,
            wellness: ctx.wellness,
            glucoseHistory: ctx.glucoseHistory.length >= 3 ? ctx.glucoseHistory : null,
            hour: new Date().getHours(),
        };

        let mlResult: MLRiskResult;
        try {
            const response = await fetch(`${ML_API_URL}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.status === 422) {
                // Input completeness error — return missing fields to frontend
                const detail = await response.json() as { detail: { message: string; missingInputs: MissingInput[]; missingCount: number } };
                res.status(422).json({
                    error: 'incomplete_inputs',
                    message: detail.detail.message,
                    missingInputs: detail.detail.missingInputs,
                    missingCount: detail.detail.missingCount,
                });
                return;
            }

            if (!response.ok) {
                throw new Error(`ML API responded with ${response.status}`);
            }

            mlResult = await response.json() as MLRiskResult;
        } catch (mlError) {
            console.warn('ML API unavailable, using fallback logic:', mlError);
            // Fallback: rule-based prediction when ML service is down
            const glucoseValue = ctx.currentGlucose;
            let riskLevel = 'normal';
            let recommendation = 'Current readings are within expected range. Consistent logging helps track patterns over time.';

            if (glucoseValue > 250) {
                riskLevel = 'high';
                recommendation = 'Recent readings are above target range. Consider reviewing this pattern with your healthcare provider.';
            } else if (glucoseValue < 75) {
                riskLevel = 'low';
                recommendation = 'Recent readings are below target. Consider having a snack and monitoring closely.';
            }

            mlResult = {
                riskLevel,
                riskCode: riskLevel === 'normal' ? 1 : riskLevel === 'low' ? 0 : 2,
                confidence: 0.5,
                recommendation,
                inputsComplete: false,
            };
        }

        // Save prediction
        const prediction = await PredictionAnalysis.create({
            userId: user._id,
            firebaseUid,
            predictedGlucose: ctx.currentGlucose,
            riskLevel: mlResult.riskLevel,
            confidence: mlResult.confidence,
            features: payload,
            modelVersion: 'v3.0-bluely-synthetic',
            recommendation: mlResult.recommendation,
        });

        // Create notification
        try {
            const notifTitle = mlResult.riskLevel === 'high'
                ? 'Elevated Risk Pattern Detected'
                : mlResult.riskLevel === 'low'
                    ? 'Low Glucose Risk Noted'
                    : 'Risk Assessment Updated';

            await Notification.create({
                userId: user._id,
                firebaseUid,
                type: 'prediction',
                title: notifTitle,
                message: mlResult.recommendation,
                data: {
                    predictedGlucose: prediction.predictedGlucose,
                    riskLevel: prediction.riskLevel,
                    confidence: prediction.confidence,
                },
            });
        } catch (notifError) {
            console.warn('Failed to create prediction notification:', notifError);
        }

        res.status(200).json({
            prediction: {
                predictedGlucose: prediction.predictedGlucose,
                riskLevel: prediction.riskLevel,
                confidence: prediction.confidence,
                recommendation: prediction.recommendation,
                modelVersion: prediction.modelVersion,
                createdAt: prediction.createdAt,
            },
        });
    } catch (error) {
        console.error('Error getting prediction:', error);
        res.status(500).json({ error: 'Prediction failed' });
    }
};

// Get prediction history
export const getPredictions = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firebaseUid, limit = '10' } = req.query;

        if (!firebaseUid) {
            res.status(400).json({ error: 'firebaseUid is required' });
            return;
        }

        const limitNum = parseInt(limit as string);

        const predictions = await PredictionAnalysis.find({
            firebaseUid: firebaseUid as string,
        })
            .sort({ createdAt: -1 })
            .limit(limitNum);

        res.status(200).json({ predictions });
    } catch (error) {
        console.error('Error fetching predictions:', error);
        res.status(500).json({ error: 'Failed to fetch predictions' });
    }
};

// Get latest prediction
export const getLatestPrediction = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firebaseUid } = req.query;

        if (!firebaseUid) {
            res.status(400).json({ error: 'firebaseUid is required' });
            return;
        }

        const prediction = await PredictionAnalysis.findOne({
            firebaseUid: firebaseUid as string,
        }).sort({ createdAt: -1 });

        if (!prediction) {
            res.status(200).json({ exists: false, prediction: null });
            return;
        }

        res.status(200).json({
            exists: true,
            prediction: {
                predictedGlucose: prediction.predictedGlucose,
                riskLevel: prediction.riskLevel,
                confidence: prediction.confidence,
                recommendation: prediction.recommendation,
                modelVersion: prediction.modelVersion,
                createdAt: prediction.createdAt,
            },
        });
    } catch (error) {
        console.error('Error fetching latest prediction:', error);
        res.status(500).json({ error: 'Failed to fetch prediction' });
    }
};

// Get weekly trend analysis
export const getTrends = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firebaseUid } = req.query;

        if (!firebaseUid) {
            res.status(400).json({ error: 'firebaseUid is required' });
            return;
        }

        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        // Current week readings
        const currentWeek = await GlucoseReading.find({
            firebaseUid: firebaseUid as string,
            recordedAt: { $gte: oneWeekAgo },
        });

        // Previous week readings
        const previousWeek = await GlucoseReading.find({
            firebaseUid: firebaseUid as string,
            recordedAt: { $gte: twoWeeksAgo, $lt: oneWeekAgo },
        });

        if (currentWeek.length === 0) {
            res.status(200).json({
                hasData: false,
                trend: null,
            });
            return;
        }

        const currentAvg =
            currentWeek.reduce((sum, r) => sum + r.value, 0) / currentWeek.length;
        const previousAvg =
            previousWeek.length > 0
                ? previousWeek.reduce((sum, r) => sum + r.value, 0) / previousWeek.length
                : null;

        // Determine trend direction
        let trendDirection: 'rising' | 'stable' | 'declining' = 'stable';
        let percentageChange = 0;
        if (previousAvg !== null) {
            percentageChange = ((currentAvg - previousAvg) / previousAvg) * 100;
            if (percentageChange > 5) trendDirection = 'rising';
            else if (percentageChange < -5) trendDirection = 'declining';
        }

        // Find most common high reading period
        const highReadings = currentWeek.filter((r) => r.value > 180);
        let riskPeriod = 'No high-risk periods detected';
        if (highReadings.length > 0) {
            const periodCounts: Record<string, number> = {};
            highReadings.forEach((r) => {
                const type = r.readingType || 'random';
                periodCounts[type] = (periodCounts[type] || 0) + 1;
            });
            const topPeriod = Object.entries(periodCounts).sort((a, b) => b[1] - a[1])[0];
            const labels: Record<string, string> = {
                fasting: 'Fasting readings appear elevated compared to other periods',
                after_meal: 'Post-meal readings show higher values than other times',
                before_meal: 'Pre-meal readings appear above typical range',
                bedtime: 'Bedtime readings tend to be higher than average',
                random: 'Some readings outside scheduled times are above target',
            };
            riskPeriod = labels[topPeriod[0]] || 'Some readings are above the target range';
        }

        // Generate recommendation
        let recommendation = 'Glucose levels appear stable this week based on logged readings.';
        if (trendDirection === 'rising') {
            recommendation =
                'Your weekly average is trending upward compared to last week. Reviewing meal and activity logs may help identify contributing patterns.';
        } else if (trendDirection === 'declining') {
            recommendation =
                'Your weekly average is trending lower than last week. Continue monitoring to confirm the pattern.';
        }

        res.status(200).json({
            hasData: true,
            trend: {
                direction: trendDirection,
                currentAverage: Math.round(currentAvg),
                previousAverage: previousAvg ? Math.round(previousAvg) : null,
                percentageChange: Math.round(percentageChange * 10) / 10,
                totalReadings: currentWeek.length,
                riskPeriod,
                recommendation,
            },
        });
    } catch (error) {
        console.error('Error fetching trends:', error);
        res.status(500).json({ error: 'Failed to fetch trends' });
    }
};

// 30-minute glucose forecast using Bluely synthetic model (v3)
export const getGlucose30 = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firebaseUid } = req.query;

        if (!firebaseUid) {
            res.status(400).json({ error: 'firebaseUid is required' });
            return;
        }

        // Check for recent readings
        const readings = await GlucoseReading.find({
            firebaseUid: firebaseUid as string,
        }).sort({ recordedAt: -1 }).limit(20);

        if (readings.length === 0) {
            res.status(200).json({ hasData: false, prediction: null });
            return;
        }

        const triggerEvent = (req.query.trigger as string) || 'auto';

        // Cache check: return recent forecast if no new data
        const lastForecast = await ForecastLog.findOne({
            firebaseUid: firebaseUid as string,
        }).sort({ createdAt: -1 });

        if (lastForecast && triggerEvent === 'auto') {
            const lastForecastTime = new Date(lastForecast.createdAt).getTime();
            const newestReadingTime = new Date(readings[0].recordedAt).getTime();
            const forecastAge = Date.now() - lastForecastTime;
            const THIRTY_MINUTES = 30 * 60 * 1000;

            if (newestReadingTime <= lastForecastTime && forecastAge < THIRTY_MINUTES) {
                res.status(200).json({
                    hasData: true,
                    prediction: {
                        predictedGlucose: lastForecast.predictedGlucose,
                        direction: lastForecast.direction,
                        directionArrow: lastForecast.directionArrow,
                        directionLabel: lastForecast.directionLabel,
                        confidence: lastForecast.confidence,
                        timeframe: lastForecast.timeframe,
                        recommendation: lastForecast.recommendation,
                        riskAlert: lastForecast.riskAlert,
                        factors: lastForecast.factors,
                        modelUsed: lastForecast.modelUsed,
                        predictionTimestamp: lastForecast.createdAt.toISOString(),
                    },
                });
                return;
            }
        }

        // Gather full context for the ML v3 API
        const ctx = await gatherPredictionContext(firebaseUid as string);

        // Build ML API v3 payload
        const payload = {
            currentGlucose: ctx.currentGlucose,
            diabetesType: ctx.diabetesType,
            meal: ctx.meal,
            medication: ctx.medication,
            activity: ctx.activity,
            wellness: ctx.wellness,
            glucoseHistory: ctx.glucoseHistory.length >= 3 ? ctx.glucoseHistory : null,
            hour: new Date().getHours(),
        };

        let result: Glucose30MLResult;

        try {
            const response = await fetch(`${ML_API_URL}/predict-glucose-30`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.status === 422) {
                // Input completeness error — return missing fields to frontend
                const detail = await response.json() as { detail: { message: string; missingInputs: MissingInput[]; missingCount: number } };
                res.status(422).json({
                    error: 'incomplete_inputs',
                    message: detail.detail.message,
                    missingInputs: detail.detail.missingInputs,
                    missingCount: detail.detail.missingCount,
                });
                return;
            }

            if (!response.ok) {
                throw new Error(`ML API responded with ${response.status}`);
            }

            result = (await response.json()) as Glucose30MLResult;
        } catch (mlError) {
            console.warn('ML predict-glucose-30 unavailable, using fallback:', mlError);

            // Fallback: simple extrapolation
            const ordered = readings.slice().reverse();
            const values = ordered.map((r) => r.value);
            const n = values.length;
            const currentGlucose = readings[0].value;
            let predicted = currentGlucose;

            if (n >= 2) {
                const slope = (values[n - 1] - values[0]) / Math.max(n - 1, 1);
                predicted = currentGlucose + slope * 0.5;
            }

            predicted = Math.max(40, Math.min(400, predicted));
            const delta = predicted - currentGlucose;
            let direction = 'stable';
            let arrow = '→';
            let label = 'Trend is stable. Glucose is expected to stay near current level';

            if (delta > 8) {
                direction = 'rising';
                arrow = '↑';
                label = 'Trend is rising. Glucose may increase over the next 30 minutes';
            } else if (delta < -8) {
                direction = 'dropping';
                arrow = '↓';
                label = 'Trend is dropping. Glucose may decrease over the next 30 minutes';
            }

            result = {
                predictedGlucose: Math.round(predicted * 10) / 10,
                direction,
                directionArrow: arrow,
                directionLabel: label,
                confidence: 0.45,
                timeframe: '30 minutes',
                recommendation: 'Based on limited data. Continue logging readings for better predictions.',
                riskAlert: predicted < 70 ? 'Glucose may drop below target' : predicted > 180 ? 'Glucose may stay above target' : null,
                factors: ['Statistical extrapolation (ML service unavailable)'],
                modelUsed: 'fallback',
                inputsComplete: false,
            };
        }

        const predictionTimestamp = new Date().toISOString();
        const user = await User.findOne({ firebaseUid: firebaseUid as string });

        // Save forecast to ForecastLog
        try {
            if (user) {
                await ForecastLog.create({
                    userId: user._id,
                    firebaseUid: firebaseUid as string,
                    predictedGlucose: result.predictedGlucose,
                    direction: result.direction,
                    directionArrow: result.directionArrow,
                    directionLabel: result.directionLabel,
                    confidence: result.confidence,
                    timeframe: result.timeframe || '30 minutes',
                    recommendation: result.recommendation,
                    riskAlert: result.riskAlert || null,
                    factors: result.factors || [],
                    modelUsed: result.modelUsed,
                    currentGlucose: ctx.currentGlucose,
                    triggerEvent,
                });
            }
        } catch (saveErr) {
            console.warn('Failed to save forecast log (non-critical):', saveErr);
        }

        res.status(200).json({
            hasData: true,
            prediction: {
                ...result,
                predictionTimestamp,
            },
        });
    } catch (error) {
        console.error('Error in getGlucose30:', error);
        res.status(500).json({ error: 'Failed to get 30-min prediction' });
    }
};

// Get forecast history
export const getForecastHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firebaseUid, limit = '20' } = req.query;

        if (!firebaseUid) {
            res.status(400).json({ error: 'firebaseUid is required' });
            return;
        }

        const forecasts = await ForecastLog.find({ firebaseUid: firebaseUid as string })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit as string, 10));

        res.status(200).json({ forecasts });
    } catch (error) {
        console.error('Error fetching forecast history:', error);
        res.status(500).json({ error: 'Failed to fetch forecast history' });
    }
};

// Estimate HbA1c from ≥21 glucose readings
export const getHbA1cEstimate = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firebaseUid } = req.query;

        if (!firebaseUid) {
            res.status(400).json({ error: 'firebaseUid is required' });
            return;
        }

        // Fetch all readings for this user (last 90 days for best accuracy)
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const readings = await GlucoseReading.find({
            firebaseUid: firebaseUid as string,
            recordedAt: { $gte: ninetyDaysAgo },
        }).sort({ recordedAt: -1 });

        const glucoseValues = readings.map(r => r.value);

        try {
            const response = await fetch(`${ML_API_URL}/estimate-hba1c`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ glucoseValues }),
            });

            if (!response.ok) {
                throw new Error(`ML API responded with ${response.status}`);
            }

            const result = await response.json() as HbA1cMLResult;
            res.status(200).json(result);
        } catch (mlError) {
            console.warn('ML estimate-hba1c unavailable, using local calculation:', mlError);

            // Local fallback using ADAG formula
            if (glucoseValues.length < 21) {
                res.status(200).json({
                    estimatedHbA1c: null,
                    averageGlucose: null,
                    glucoseStd: null,
                    readingCount: glucoseValues.length,
                    readingsNeeded: 21 - glucoseValues.length,
                    confidenceNote: `Need ${21 - glucoseValues.length} more readings for estimation.`,
                    interpretation: null,
                });
                return;
            }

            const avg = glucoseValues.reduce((s, v) => s + v, 0) / glucoseValues.length;
            const std = Math.sqrt(glucoseValues.reduce((s, v) => s + (v - avg) ** 2, 0) / glucoseValues.length);
            const hba1c = Math.round(((avg + 46.7) / 28.7) * 10) / 10;

            let interpretation = 'Within normal range';
            if (hba1c >= 6.5) interpretation = 'Diabetic range — discuss with your healthcare provider';
            else if (hba1c >= 5.7) interpretation = 'Prediabetic range — lifestyle modifications may help';

            res.status(200).json({
                estimatedHbA1c: hba1c,
                averageGlucose: Math.round(avg * 10) / 10,
                glucoseStd: Math.round(std * 10) / 10,
                readingCount: glucoseValues.length,
                readingsNeeded: 0,
                confidenceNote: glucoseValues.length >= 50
                    ? 'Good confidence — based on many readings'
                    : 'Moderate confidence — more readings improve accuracy',
                interpretation,
            });
        }
    } catch (error) {
        console.error('Error estimating HbA1c:', error);
        res.status(500).json({ error: 'Failed to estimate HbA1c' });
    }
};

// Weekly glucose analysis (TIR, insights, patterns)
export const getWeeklyAnalysis = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firebaseUid } = req.query;

        if (!firebaseUid) {
            res.status(400).json({ error: 'firebaseUid is required' });
            return;
        }

        const user = await User.findOne({ firebaseUid: firebaseUid as string });

        // Fetch readings from the past week
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const readings = await GlucoseReading.find({
            firebaseUid: firebaseUid as string,
            recordedAt: { $gte: oneWeekAgo },
        }).sort({ recordedAt: 1 });

        if (readings.length < 7) {
            res.status(200).json({
                hasData: false,
                message: `Need at least 7 readings for weekly analysis. You have ${readings.length}.`,
            });
            return;
        }

        // Build ML payload
        const mlReadings = readings.map(r => ({
            value: r.value,
            readingType: r.readingType || 'random',
            hour: new Date(r.recordedAt).getHours(),
            day: new Date(r.recordedAt).getDay() === 0 ? 6 : new Date(r.recordedAt).getDay() - 1, // Convert to Mon=0
        }));

        try {
            const response = await fetch(`${ML_API_URL}/analyze-weekly`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    readings: mlReadings,
                    diabetesType: user?.diabetesType || null,
                }),
            });

            if (!response.ok) {
                throw new Error(`ML API responded with ${response.status}`);
            }

            const result = await response.json() as WeeklyAnalysisMLResult;
            res.status(200).json({ hasData: true, analysis: result });
        } catch (mlError) {
            console.warn('ML analyze-weekly unavailable, using local calculation:', mlError);

            // Local fallback
            const values = readings.map(r => r.value);
            const avg = values.reduce((s, v) => s + v, 0) / values.length;
            const std = Math.sqrt(values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length);
            const inRange = values.filter(v => v >= 70 && v <= 180).length;
            const below = values.filter(v => v < 70).length;
            const above = values.filter(v => v > 180).length;

            res.status(200).json({
                hasData: true,
                analysis: {
                    averageGlucose: Math.round(avg * 10) / 10,
                    glucoseStd: Math.round(std * 10) / 10,
                    timeInRange: Math.round(inRange / values.length * 1000) / 10,
                    timeBelowRange: Math.round(below / values.length * 1000) / 10,
                    timeAboveRange: Math.round(above / values.length * 1000) / 10,
                    fastingAverage: null,
                    postMealAverage: null,
                    bestDay: null,
                    worstDay: null,
                    insights: ['Weekly analysis computed locally (ML service unavailable).'],
                },
            });
        }
    } catch (error) {
        console.error('Error in weekly analysis:', error);
        res.status(500).json({ error: 'Failed to perform weekly analysis' });
    }
};
