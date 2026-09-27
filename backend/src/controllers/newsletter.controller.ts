import { Request, Response } from 'express';
import { NewsletterSubscription } from '../models';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const subscribeToNewsletter = async (req: Request, res: Response): Promise<void> => {
    try {
        const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';

        if (!email || !emailPattern.test(email) || email.length > 254) {
            res.status(400).json({ error: 'Please enter a valid email address' });
            return;
        }

        const existing = await NewsletterSubscription.findOne({ email });
        if (existing) {
            res.status(200).json({ success: true, alreadySubscribed: existing.status === 'active' });
            return;
        }

        await NewsletterSubscription.create({
            email,
            source: 'homepage',
            status: 'active',
            subscribedAt: new Date(),
        });

        res.status(201).json({ success: true, alreadySubscribed: false });
    } catch (error) {
        console.error('Error subscribing to newsletter:', error);
        res.status(500).json({ error: 'Unable to join the Bluely community right now' });
    }
};