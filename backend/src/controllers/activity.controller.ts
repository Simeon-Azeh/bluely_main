import { Request, Response } from 'express';
import { Activity, User } from '../models';

// Create an activity log
export const createActivity = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firebaseUid, activityLevel, activityType, durationMinutes, timestamp } = req.body;

        if (!firebaseUid || !activityLevel) {
            res.status(400).json({ error: 'firebaseUid and activityLevel are required' });
            return;
        }

        const user = await User.findOne({ firebaseUid });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const activity = await Activity.create({
            userId: user._id,
            firebaseUid,
            activityLevel,
            activityType,
            durationMinutes,
            timestamp: timestamp ? new Date(timestamp) : new Date(),
        });

        res.status(201).json(activity);
    } catch (error) {
        console.error('Error creating activity:', error);
        res.status(500).json({ error: 'Failed to create activity' });
    }
};

// Get activities for a user
export const getActivities = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firebaseUid, startDate, endDate, limit = '50', page = '1' } = req.query;

        if (!firebaseUid) {
            res.status(400).json({ error: 'firebaseUid is required' });
            return;
        }

        interface QueryFilter {
            firebaseUid: string;
            timestamp?: { $gte?: Date; $lte?: Date };
        }

        const query: QueryFilter = { firebaseUid: firebaseUid as string };

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate as string);
            if (endDate) query.timestamp.$lte = new Date(endDate as string);
        }

        const limitNum = parseInt(limit as string);
        const pageNum = parseInt(page as string);
        const skip = (pageNum - 1) * limitNum;

        const [activities, total] = await Promise.all([
            Activity.find(query).sort({ timestamp: -1 }).skip(skip).limit(limitNum),
            Activity.countDocuments(query),
        ]);

        res.status(200).json({
            activities,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
};

// Delete an activity
export const deleteActivity = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const deleted = await Activity.findByIdAndDelete(id);

        if (!deleted) {
            res.status(404).json({ error: 'Activity not found' });
            return;
        }

        res.status(200).json({ message: 'Activity deleted successfully' });
    } catch (error) {
        console.error('Error deleting activity:', error);
        res.status(500).json({ error: 'Failed to delete activity' });
    }
};
