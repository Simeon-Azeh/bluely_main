import { Request, Response } from 'express';
import { Meal, User } from '../models';

// Create a meal log
export const createMeal = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firebaseUid, carbsEstimate, mealType, mealCategory, description, timestamp } = req.body;

        if (!firebaseUid || !mealType) {
            res.status(400).json({ error: 'firebaseUid and mealType are required' });
            return;
        }

        const user = await User.findOne({ firebaseUid });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const meal = await Meal.create({
            userId: user._id,
            firebaseUid,
            carbsEstimate,
            mealType,
            mealCategory: mealCategory || 'other',
            description,
            timestamp: timestamp ? new Date(timestamp) : new Date(),
        });

        res.status(201).json(meal);
    } catch (error) {
        console.error('Error creating meal:', error);
        res.status(500).json({ error: 'Failed to create meal' });
    }
};

// Get meals for a user
export const getMeals = async (req: Request, res: Response): Promise<void> => {
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

        const [meals, total] = await Promise.all([
            Meal.find(query).sort({ timestamp: -1 }).skip(skip).limit(limitNum),
            Meal.countDocuments(query),
        ]);

        res.status(200).json({
            meals,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.error('Error fetching meals:', error);
        res.status(500).json({ error: 'Failed to fetch meals' });
    }
};

// Delete a meal
export const deleteMeal = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const deleted = await Meal.findByIdAndDelete(id);

        if (!deleted) {
            res.status(404).json({ error: 'Meal not found' });
            return;
        }

        res.status(200).json({ message: 'Meal deleted successfully' });
    } catch (error) {
        console.error('Error deleting meal:', error);
        res.status(500).json({ error: 'Failed to delete meal' });
    }
};
