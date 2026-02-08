import { Request, Response } from 'express';
import { GlucoseReading, User } from '../models';
import { AuthRequest } from '../middleware/auth';

// Create a new glucose reading
export const createReading = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            firebaseUid,
            value,
            unit = 'mg/dL',
            readingType = 'random',
            mealContext,
            activityContext,
            notes,
            recordedAt,
        } = req.body;

        if (!firebaseUid || value === undefined) {
            res.status(400).json({ error: 'firebaseUid and value are required' });
            return;
        }

        // Get user ID
        const user = await User.findOne({ firebaseUid });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Create glucose reading
        const newReading = await GlucoseReading.create({
            userId: user._id,
            firebaseUid,
            value,
            unit,
            readingType,
            mealContext,
            activityContext,
            notes,
            recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
        });

        res.status(201).json(newReading);
    } catch (error) {
        console.error('Error creating glucose reading:', error);
        res.status(500).json({ error: 'Failed to create glucose reading' });
    }
};

// Get glucose readings for a user
export const getReadings = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            firebaseUid,
            startDate,
            endDate,
            limit = '50',
            page = '1',
        } = req.query;

        if (!firebaseUid) {
            res.status(400).json({ error: 'firebaseUid is required' });
            return;
        }

        // Build query
        interface QueryFilter {
            firebaseUid: string;
            recordedAt?: {
                $gte?: Date;
                $lte?: Date;
            };
        }

        const query: QueryFilter = { firebaseUid: firebaseUid as string };

        if (startDate || endDate) {
            query.recordedAt = {};
            if (startDate) query.recordedAt.$gte = new Date(startDate as string);
            if (endDate) query.recordedAt.$lte = new Date(endDate as string);
        }

        const limitNum = parseInt(limit as string);
        const pageNum = parseInt(page as string);
        const skip = (pageNum - 1) * limitNum;

        const [readings, total] = await Promise.all([
            GlucoseReading.find(query)
                .sort({ recordedAt: -1 })
                .skip(skip)
                .limit(limitNum),
            GlucoseReading.countDocuments(query),
        ]);

        res.status(200).json({
            readings,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.error('Error fetching glucose readings:', error);
        res.status(500).json({ error: 'Failed to fetch glucose readings' });
    }
};

// Get a specific glucose reading
export const getReadingById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const reading = await GlucoseReading.findById(id);

        if (!reading) {
            res.status(404).json({ error: 'Glucose reading not found' });
            return;
        }

        res.status(200).json(reading);
    } catch (error) {
        console.error('Error fetching glucose reading:', error);
        res.status(500).json({ error: 'Failed to fetch glucose reading' });
    }
};

// Update a glucose reading
export const updateReading = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { value, unit, readingType, mealContext, activityContext, notes, recordedAt } = req.body;

        const updateData: Record<string, unknown> = {};
        if (value !== undefined) updateData.value = value;
        if (unit) updateData.unit = unit;
        if (readingType) updateData.readingType = readingType;
        if (mealContext !== undefined) updateData.mealContext = mealContext;
        if (activityContext !== undefined) updateData.activityContext = activityContext;
        if (notes !== undefined) updateData.notes = notes;
        if (recordedAt) updateData.recordedAt = new Date(recordedAt);

        const updatedReading = await GlucoseReading.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedReading) {
            res.status(404).json({ error: 'Glucose reading not found' });
            return;
        }

        res.status(200).json(updatedReading);
    } catch (error) {
        console.error('Error updating glucose reading:', error);
        res.status(500).json({ error: 'Failed to update glucose reading' });
    }
};

// Delete a glucose reading
export const deleteReading = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const deletedReading = await GlucoseReading.findByIdAndDelete(id);

        if (!deletedReading) {
            res.status(404).json({ error: 'Glucose reading not found' });
            return;
        }

        res.status(200).json({ message: 'Glucose reading deleted successfully' });
    } catch (error) {
        console.error('Error deleting glucose reading:', error);
        res.status(500).json({ error: 'Failed to delete glucose reading' });
    }
};

// Get glucose statistics
export const getStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firebaseUid, days = '7' } = req.query;

        if (!firebaseUid) {
            res.status(400).json({ error: 'firebaseUid is required' });
            return;
        }

        // Get user for target ranges
        const user = await User.findOne({ firebaseUid: firebaseUid as string });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const daysNum = parseInt(days as string);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysNum);

        // Get readings for the period
        const readings = await GlucoseReading.find({
            firebaseUid: firebaseUid as string,
            recordedAt: { $gte: startDate },
        }).sort({ recordedAt: -1 });

        if (readings.length === 0) {
            res.status(200).json({
                totalReadings: 0,
                averageGlucose: null,
                minGlucose: null,
                maxGlucose: null,
                inRangePercentage: null,
                belowRangePercentage: null,
                aboveRangePercentage: null,
                targetMin: user.targetGlucoseMin,
                targetMax: user.targetGlucoseMax,
                readingsByDay: [],
            });
            return;
        }

        // Calculate statistics
        const values = readings.map((r) => r.value);
        const sum = values.reduce((a, b) => a + b, 0);
        const average = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);

        // Calculate time in range
        const targetMin = user.targetGlucoseMin;
        const targetMax = user.targetGlucoseMax;

        const inRange = values.filter((v) => v >= targetMin && v <= targetMax).length;
        const belowRange = values.filter((v) => v < targetMin).length;
        const aboveRange = values.filter((v) => v > targetMax).length;

        // Group readings by day
        const readingsByDay = readings.reduce(
            (
                acc: Record<string, { date: string; readings: typeof readings; average: number }>,
                reading
            ) => {
                const date = reading.recordedAt.toISOString().split('T')[0];
                if (!acc[date]) {
                    acc[date] = { date, readings: [], average: 0 };
                }
                acc[date].readings.push(reading);
                return acc;
            },
            {}
        );

        // Calculate daily averages
        Object.values(readingsByDay).forEach((day) => {
            const dayValues = day.readings.map((r) => r.value);
            day.average = dayValues.reduce((a, b) => a + b, 0) / dayValues.length;
        });

        res.status(200).json({
            totalReadings: readings.length,
            averageGlucose: Math.round(average),
            minGlucose: min,
            maxGlucose: max,
            inRangePercentage: Math.round((inRange / values.length) * 100),
            belowRangePercentage: Math.round((belowRange / values.length) * 100),
            aboveRangePercentage: Math.round((aboveRange / values.length) * 100),
            targetMin,
            targetMax,
            readingsByDay: Object.values(readingsByDay).sort(
                (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            ),
        });
    } catch (error) {
        console.error('Error fetching glucose stats:', error);
        res.status(500).json({ error: 'Failed to fetch glucose statistics' });
    }
};
