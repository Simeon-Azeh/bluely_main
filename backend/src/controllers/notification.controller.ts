import { Request, Response } from 'express';
import { Notification, User } from '../models';

// Get notifications for a user
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firebaseUid, unreadOnly = 'false', limit = '50', page = '1' } = req.query;

        if (!firebaseUid) {
            res.status(400).json({ error: 'firebaseUid is required' });
            return;
        }

        const query: Record<string, unknown> = { firebaseUid: firebaseUid as string };
        if (unreadOnly === 'true') {
            query.isRead = false;
        }

        const limitNum = parseInt(limit as string);
        const pageNum = parseInt(page as string);
        const skip = (pageNum - 1) * limitNum;

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
            Notification.countDocuments(query),
            Notification.countDocuments({ firebaseUid: firebaseUid as string, isRead: false }),
        ]);

        res.status(200).json({
            notifications,
            unreadCount,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

// Get unread notification count
export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firebaseUid } = req.query;

        if (!firebaseUid) {
            res.status(400).json({ error: 'firebaseUid is required' });
            return;
        }

        const unreadCount = await Notification.countDocuments({
            firebaseUid: firebaseUid as string,
            isRead: false,
        });

        res.status(200).json({ unreadCount });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
};

// Mark a notification as read
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const notification = await Notification.findByIdAndUpdate(
            id,
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            res.status(404).json({ error: 'Notification not found' });
            return;
        }

        res.status(200).json(notification);
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
};

// Mark all notifications as read
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firebaseUid } = req.body;

        if (!firebaseUid) {
            res.status(400).json({ error: 'firebaseUid is required' });
            return;
        }

        await Notification.updateMany(
            { firebaseUid, isRead: false },
            { isRead: true }
        );

        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
};

// Create a notification
export const createNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firebaseUid, type, title, message, data } = req.body;

        if (!firebaseUid || !type || !title || !message) {
            res.status(400).json({ error: 'firebaseUid, type, title, and message are required' });
            return;
        }

        const user = await User.findOne({ firebaseUid });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const notification = await Notification.create({
            userId: user._id,
            firebaseUid,
            type,
            title,
            message,
            data,
        });

        res.status(201).json(notification);
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ error: 'Failed to create notification' });
    }
};

// Delete a notification
export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const deleted = await Notification.findByIdAndDelete(id);
        if (!deleted) {
            res.status(404).json({ error: 'Notification not found' });
            return;
        }

        res.status(200).json({ message: 'Notification deleted' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
};
