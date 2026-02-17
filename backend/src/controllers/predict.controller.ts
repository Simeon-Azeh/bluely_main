import { Request, Response } from 'express';
import { PredictionAnalysis, User, GlucoseReading, UserHealthProfile, Notification, ForecastLog, MedicationLog, Meal } from '../models';
import type { IMedicationLog } from '../models/MedicationLog';
import type { IMeal } from '../models/Meal';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

interface MLResult {
    predicted_risk: number;
    risk_level: string;
    confidence: number;
    recommendation: string;
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
    suggestions?: string[] | null;
}

// Helper: calculate age from DOB
function calculateAge(dob?: Date): number {
    if (!dob) return 30; // default
    const diff = Date.now() - dob.getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

// Request a prediction from the ML service
export const getPrediction = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firebaseUid } = req.body;

        if (!firebaseUid) {
            res.status(400).json({ error: 'firebaseUid is required' });
            return;
        }

        // 1. Gather user data
        const user = await User.findOne({ firebaseUid });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const latestReading = await GlucoseReading.findOne({ firebaseUid }).sort({ recordedAt: -1 });
        const healthProfile = await UserHealthProfile.findOne({ firebaseUid });

        // 2. Build features for the Pima-trained model
        const features = {
            pregnancies: 0,
            glucose: latestReading?.value || 100,
            blood_pressure: 72,
            skin_thickness: 29,
            insulin: 80,
            bmi: 32,
            diabetes_pedigree: 0.5,
            age: calculateAge(user.dateOfBirth),
        };

        // 3. Call the FastAPI ML service
        let mlResult: MLResult;
        try {
            const response = await fetch(`${ML_API_URL}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(features),
            });

            if (!response.ok) {
                throw new Error(`ML API responded with ${response.status}`);
            }

            mlResult = await response.json() as MLResult;
        } catch (mlError) {
            console.warn('ML API unavailable, using fallback logic:', mlError);
            // Fallback: rule-based prediction when ML service is down
            const glucoseValue = latestReading?.value || 100;
            let riskLevel: 'normal' | 'elevated' | 'critical' = 'normal';
            let recommendation = 'Current readings are within expected range. Consistent logging helps track patterns over time.';

            if (glucoseValue > 180) {
                riskLevel = 'critical';
                recommendation = 'Recent readings are above target range. Consider reviewing this pattern with your healthcare provider.';
            } else if (glucoseValue > 140) {
                riskLevel = 'elevated';
                recommendation = 'Recent readings are slightly above target. More frequent monitoring may help clarify the trend.';
            }

            mlResult = {
                predicted_risk: riskLevel === 'normal' ? 0 : 1,
                risk_level: riskLevel,
                confidence: 0.65,
                recommendation,
            };
        }

        // 4. Save prediction
        const prediction = await PredictionAnalysis.create({
            userId: user._id,
            firebaseUid,
            predictedGlucose: latestReading?.value || 100,
            riskLevel: mlResult.risk_level,
            confidence: mlResult.confidence,
            features,
            modelVersion: 'v1.0',
            recommendation: mlResult.recommendation,
        });

        // 5. Create notification for prediction
        try {
            const notifTitle = mlResult.risk_level === 'critical'
                ? 'Elevated Risk Pattern Detected'
                : mlResult.risk_level === 'elevated'
                    ? 'Moderate Risk Pattern Noted'
                    : 'Risk Assessment Updated';
            const notifMessage = mlResult.recommendation;

            await Notification.create({
                userId: user._id,
                firebaseUid,
                type: 'prediction',
                title: notifTitle,
                message: notifMessage,
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

// 30-minute glucose forecast using OhioT1DM model
export const getGlucose30 = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firebaseUid } = req.query;

        if (!firebaseUid) {
            res.status(400).json({ error: 'firebaseUid is required' });
            return;
        }

        // Get recent readings (up to 20)
        const readings = await GlucoseReading.find({
            firebaseUid: firebaseUid as string,
        })
            .sort({ recordedAt: -1 })
            .limit(20);

        if (readings.length === 0) {
            res.status(200).json({ hasData: false, prediction: null });
            return;
        }

        const triggerEvent = (req.query.trigger as string) || 'auto';

        // ── Cache check: return the most recent forecast if no new data since ──
        // Only recalculate when triggered by a new log event or when readings
        // are newer than the last forecast.
        const lastForecast = await ForecastLog.findOne({
            firebaseUid: firebaseUid as string,
        }).sort({ createdAt: -1 });

        if (lastForecast && triggerEvent === 'auto') {
            const lastForecastTime = new Date(lastForecast.createdAt).getTime();
            const newestReadingTime = new Date(readings[0].recordedAt).getTime();
            const forecastAge = Date.now() - lastForecastTime;
            const THIRTY_MINUTES = 30 * 60 * 1000;

            // Return cached forecast if:
            // 1. No new readings since the last forecast, AND
            // 2. The forecast is less than 30 minutes old
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

        // Reverse to oldest→newest
        const ordered = readings.reverse();
        const currentGlucose = ordered[ordered.length - 1].value;
        const lastHour = new Date(ordered[ordered.length - 1].recordedAt).getHours();

        // Get health profile for context
        const healthProfile = await UserHealthProfile.findOne({ firebaseUid: firebaseUid as string });
        const user = await User.findOne({ firebaseUid: firebaseUid as string });

        // Query recent medication logs (last 6 hours) for insulin/med context
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
        const recentMedLogs = await MedicationLog.find({
            firebaseUid: firebaseUid as string,
            takenAt: { $gte: sixHoursAgo },
        }).sort({ takenAt: -1 }).limit(10);

        // Query recent meals (last 4 hours) for carb context
        const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
        const recentMeals = await Meal.find({
            firebaseUid: firebaseUid as string,
            timestamp: { $gte: fourHoursAgo },
        }).sort({ timestamp: -1 }).limit(5);

        // Build payload for ML
        const mlReadings = ordered.map((r) => ({
            value: r.value,
            readingType: r.readingType || 'random',
            hour: new Date(r.recordedAt).getHours(),
            dayOfWeek: new Date(r.recordedAt).getDay(),
            medicationTaken: r.medicationTaken || false,
            mealContext: r.mealContext || null,
            activityContext: r.activityContext || null,
        }));

        // Build medication context for ML
        const recentMedications = recentMedLogs.map((log: IMedicationLog) => ({
            medicationType: log.medicationType,
            dosage: log.dosage,
            doseUnit: log.doseUnit,
            hoursSincesTaken: Math.round(((Date.now() - new Date(log.takenAt).getTime()) / (1000 * 60 * 60)) * 10) / 10,
        }));

        // Build meal context for ML
        const recentMealData = recentMeals.map((meal: IMeal) => ({
            mealType: meal.mealType,
            carbsEstimate: meal.carbsEstimate || null,
            hoursSinceMeal: Math.round(((Date.now() - new Date(meal.timestamp).getTime()) / (1000 * 60 * 60)) * 10) / 10,
        }));

        const payload = {
            readings: mlReadings,
            currentGlucose,
            diabetesType: user?.diabetesType || null,
            onMedication: healthProfile?.onMedication || false,
            lastMealHoursAgo: null as number | null,
            activityLevel: healthProfile?.activityLevel || null,
            recentMedications,
            recentMeals: recentMealData,
        };

        // Try to determine time since last meal (from Meal model first, fallback to reading context)
        if (recentMeals.length > 0) {
            const hoursSince = (Date.now() - new Date(recentMeals[0].timestamp).getTime()) / (1000 * 60 * 60);
            payload.lastMealHoursAgo = Math.round(hoursSince * 10) / 10;
        } else {
            const lastMealReading = ordered.find(
                (r) => r.readingType === 'after_meal' || r.mealContext
            );
            if (lastMealReading) {
                const hoursSince =
                    (Date.now() - new Date(lastMealReading.recordedAt).getTime()) / (1000 * 60 * 60);
                payload.lastMealHoursAgo = Math.round(hoursSince * 10) / 10;
            }
        }

        let result: Glucose30MLResult;

        try {
            const response = await fetch(`${ML_API_URL}/predict-glucose-30`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`ML API responded with ${response.status}`);
            }

            result = (await response.json()) as Glucose30MLResult;
        } catch (mlError) {
            console.warn('ML predict-glucose-30 unavailable, using fallback:', mlError);

            // Fallback: simple extrapolation
            const values = ordered.map((r) => r.value);
            const n = values.length;
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
            };
        }

        const predictionTimestamp = new Date().toISOString();

        // Save forecast to ForecastLog for historical tracking
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
                    currentGlucose,
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
