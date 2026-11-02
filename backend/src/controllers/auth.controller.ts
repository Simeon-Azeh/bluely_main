import { Response } from 'express';
import { User } from '../models';
import { AuthRequest } from '../middleware/auth';

export const getAuthenticatedUser = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user?.uid) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const profile = await User.findOne({ firebaseUid: req.user.uid });

        res.status(200).json({
            authenticated: true,
            user: {
                uid: req.user.uid,
                email: req.user.email ?? null,
            },
            profile: profile ?? null,
        });
    } catch (error) {
        console.error('Error fetching authenticated user:', error);
        res.status(500).json({ error: 'Failed to fetch authenticated user' });
    }
};
