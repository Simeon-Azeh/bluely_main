import { Request, Response } from 'express';
import { PredictionAnalysis, User, GlucoseReading, UserHealthProfile } from '../models';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

interface MLResult {
    predicted_risk: number;
    risk_level: string;
    confidence: number;
    recommendation: string;
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
            let recommendation = 'Keep up the great work maintaining your glucose levels.';

            if (glucoseValue > 180) {
                riskLevel = 'critical';
                recommendation = 'Your glucose is elevated. Consider consulting your healthcare provider.';
            } else if (glucoseValue > 140) {
                riskLevel = 'elevated';
                recommendation = 'Monitor more frequently and consider reducing carb intake.';
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
                fasting: 'Fasting readings tend to run high',
                after_meal: 'Post-meal readings tend to spike',
                before_meal: 'Pre-meal readings tend to run high',
                bedtime: 'Bedtime readings tend to be elevated',
                random: 'Some random readings are elevated',
            };
            riskPeriod = labels[topPeriod[0]] || 'Some readings are elevated';
        }

        // Generate recommendation
        let recommendation = 'Your glucose levels are looking stable. Keep it up!';
        if (trendDirection === 'rising') {
            recommendation =
                'Your average glucose has been rising. Consider reviewing your meals and activity.';
        } else if (trendDirection === 'declining') {
            recommendation =
                'Your average glucose is trending down — good progress!';
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
