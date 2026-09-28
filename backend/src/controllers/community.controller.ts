import { Request, Response } from 'express';
import { ContactMessage, VolunteerApplication } from '../models';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const contactTopics = ['general', 'partnership', 'press', 'privacy', 'support'];

export const submitContactMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, topic, message } = req.body;
        if (!name || !email || !topic || !message || !emailPattern.test(email) || !contactTopics.includes(topic)) {
            res.status(400).json({ error: 'Please complete the required contact fields' });
            return;
        }

        const contactMessage = await ContactMessage.create({
            name: name.trim(), email: email.trim().toLowerCase(), topic, message: message.trim(),
        });
        res.status(201).json({ success: true, contactMessage: { id: contactMessage._id } });
    } catch (error) {
        console.error('Error submitting contact message:', error);
        res.status(500).json({ error: 'Unable to send your message right now' });
    }
};

export const submitVolunteerApplication = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, location, interests, availability, experience } = req.body;
        if (!name || !email || !location || !interests || !emailPattern.test(email)) {
            res.status(400).json({ error: 'Please complete the required volunteer fields' });
            return;
        }

        const application = await VolunteerApplication.create({
            name: name.trim(), email: email.trim().toLowerCase(), location: location.trim(),
            interests: interests.trim(), availability: availability?.trim(), experience: experience?.trim(),
        });
        res.status(201).json({ success: true, volunteerApplication: { id: application._id } });
    } catch (error) {
        console.error('Error submitting volunteer application:', error);
        res.status(500).json({ error: 'Unable to send your application right now' });
    }
};