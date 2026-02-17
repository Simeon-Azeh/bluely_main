import { Request, Response } from 'express';
import { MoodLog, LifestyleLog, User } from '../models';

// Log a mood entry
export const logMood = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firebaseUid, mood, period, note } = req.body;

        if (!firebaseUid || !mood || !period) {
            res.status(400).json({ error: 'firebaseUid, mood, and period are required' });
            return;
        }

        const user = await User.findOne({ firebaseUid });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const moodLog = await MoodLog.create({
            userId: user._id,
            firebaseUid,
            mood,
            period,
            note,
        });

        res.status(201).json({ success: true, moodLog });
    } catch (error) {
        console.error('Error logging mood:', error);
        res.status(500).json({ error: 'Failed to log mood' });
    }
};

// Get mood logs for a user
export const getMoodLogs = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firebaseUid, limit = '20' } = req.query;

        if (!firebaseUid) {
            res.status(400).json({ error: 'firebaseUid is required' });
            return;
        }

        const logs = await MoodLog.find({ firebaseUid: firebaseUid as string })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit as string));

        res.status(200).json({ logs });
    } catch (error) {
        console.error('Error fetching mood logs:', error);
        res.status(500).json({ error: 'Failed to fetch mood logs' });
    }
};

// Get latest mood for a user
export const getLatestMood = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firebaseUid } = req.query;

        if (!firebaseUid) {
            res.status(400).json({ error: 'firebaseUid is required' });
            return;
        }

        const moodLog = await MoodLog.findOne({ firebaseUid: firebaseUid as string })
            .sort({ createdAt: -1 });

        if (!moodLog) {
            res.status(200).json({ exists: false, moodLog: null });
            return;
        }

        res.status(200).json({ exists: true, moodLog });
    } catch (error) {
        console.error('Error fetching latest mood:', error);
        res.status(500).json({ error: 'Failed to fetch latest mood' });
    }
};

// Log a lifestyle check-in
export const logLifestyle = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firebaseUid, exerciseFrequency, sleepQuality, stressLevel } = req.body;

        if (!firebaseUid || !exerciseFrequency || sleepQuality === undefined || stressLevel === undefined) {
            res.status(400).json({ error: 'firebaseUid, exerciseFrequency, sleepQuality, and stressLevel are required' });
            return;
        }

        const user = await User.findOne({ firebaseUid });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const lifestyleLog = await LifestyleLog.create({
            userId: user._id,
            firebaseUid,
            exerciseFrequency,
            sleepQuality,
            stressLevel,
        });

        res.status(201).json({ success: true, lifestyleLog });
    } catch (error) {
        console.error('Error logging lifestyle:', error);
        res.status(500).json({ error: 'Failed to log lifestyle' });
    }
};

// Get lifestyle logs for a user
export const getLifestyleLogs = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firebaseUid, limit = '20' } = req.query;

        if (!firebaseUid) {
            res.status(400).json({ error: 'firebaseUid is required' });
            return;
        }

        const logs = await LifestyleLog.find({ firebaseUid: firebaseUid as string })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit as string));

        res.status(200).json({ logs });
    } catch (error) {
        console.error('Error fetching lifestyle logs:', error);
        res.status(500).json({ error: 'Failed to fetch lifestyle logs' });
    }
};
