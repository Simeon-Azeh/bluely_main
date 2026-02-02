import { Request, Response } from 'express';
import { User } from '../models';
import { AuthRequest } from '../middleware/auth';

// Create a new user
export const createUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firebaseUid, email, displayName } = req.body;

        if (!firebaseUid || !email || !displayName) {
            res.status(400).json({ error: 'firebaseUid, email, and displayName are required' });
            return;
        }

        // Check if user already exists
        const existingUser = await User.findOne({ firebaseUid });
        if (existingUser) {
            res.status(200).json(existingUser);
            return;
        }

        // Create new user
        const newUser = await User.create({
            firebaseUid,
            email,
            displayName,
            onboardingCompleted: false,
        });

        res.status(201).json(newUser);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
};

// Get user by Firebase UID
export const getUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firebaseUid } = req.query;

        if (!firebaseUid) {
            res.status(400).json({ error: 'firebaseUid is required' });
            return;
        }

        const user = await User.findOne({ firebaseUid: firebaseUid as string });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};

// Get current authenticated user
export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.uid) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const user = await User.findOne({ firebaseUid: req.user.uid });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching current user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};

// Update user
export const updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firebaseUid, ...updateData } = req.body;

        if (!firebaseUid) {
            res.status(400).json({ error: 'firebaseUid is required' });
            return;
        }

        // Remove fields that shouldn't be updated directly
        delete updateData.email;
        delete updateData.createdAt;

        const updatedUser = await User.findOneAndUpdate(
            { firebaseUid },
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
};

// Delete user
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.uid) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const deletedUser = await User.findOneAndDelete({ firebaseUid: req.user.uid });

        if (!deletedUser) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};
