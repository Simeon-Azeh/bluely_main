import { Request, Response } from 'express';
import { UserHealthProfile, User } from '../models';

// Helper to calculate profile completeness
function calculateCompleteness(profile: Record<string, unknown>): number {
    const fields = [
        'activityLevel',
        'exerciseFrequency',
        'sleepQuality',
        'stressLevel',
        'mealPreference',
        'onMedication',
        'medicationCategory',
    ];
    const filled = fields.filter(
        (f) => profile[f] !== undefined && profile[f] !== null && profile[f] !== 'none'
    ).length;
    return Math.round((filled / fields.length) * 100);
}

// Get or create health profile
export const getHealthProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firebaseUid } = req.query;

        if (!firebaseUid) {
            res.status(400).json({ error: 'firebaseUid is required' });
            return;
        }

        const profile = await UserHealthProfile.findOne({ firebaseUid: firebaseUid as string });

        if (!profile) {
            // Return empty profile indicator — no profile created yet
            res.status(200).json({ exists: false, profile: null });
            return;
        }

        res.status(200).json({ exists: true, profile });
    } catch (error) {
        console.error('Error fetching health profile:', error);
        res.status(500).json({ error: 'Failed to fetch health profile' });
    }
};

// Create or update health profile
export const upsertHealthProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firebaseUid, ...profileData } = req.body;

        if (!firebaseUid) {
            res.status(400).json({ error: 'firebaseUid is required' });
            return;
        }

        const user = await User.findOne({ firebaseUid });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Calculate completeness
        const existing = await UserHealthProfile.findOne({ firebaseUid });
        const merged = { ...(existing?.toObject() || {}), ...profileData };
        const completeness = calculateCompleteness(merged);

        const profile = await UserHealthProfile.findOneAndUpdate(
            { firebaseUid },
            {
                $set: {
                    ...profileData,
                    profileCompleteness: completeness,
                },
                $setOnInsert: {
                    userId: user._id,
                    firebaseUid,
                },
            },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json({ exists: true, profile });
    } catch (error) {
        console.error('Error upserting health profile:', error);
        res.status(500).json({ error: 'Failed to update health profile' });
    }
};

// Dismiss a prompt (increments dismiss counter, updates last prompt timestamp)
export const dismissPrompt = async (req: Request, res: Response): Promise<void> => {
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

        const profile = await UserHealthProfile.findOneAndUpdate(
            { firebaseUid },
            {
                $inc: { promptsDismissed: 1 },
                $set: { lastPromptShown: new Date() },
                $setOnInsert: {
                    userId: user._id,
                    firebaseUid,
                },
            },
            { new: true, upsert: true }
        );

        res.status(200).json({ profile });
    } catch (error) {
        console.error('Error dismissing prompt:', error);
        res.status(500).json({ error: 'Failed to dismiss prompt' });
    }
};
