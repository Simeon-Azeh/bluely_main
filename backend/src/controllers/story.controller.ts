import { Request, Response } from 'express';
import { StorySubmission } from '../models';

const diabetesTypes = ['type1', 'type2', 'gestational', 'prediabetes', 'other', 'prefer_not_to_say'];

export const submitStory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, phone, location, diabetesType, diagnosisYear, story, permissionToContact } = req.body;

        if (!name || !email || !location || !diabetesType || !story || permissionToContact !== true) {
            res.status(400).json({ error: 'Name, email, location, diabetes type, story, and contact permission are required' });
            return;
        }

        if (!diabetesTypes.includes(diabetesType)) {
            res.status(400).json({ error: 'Please select a valid diabetes type' });
            return;
        }

        const storySubmission = await StorySubmission.create({ name, email, phone, location, diabetesType, diagnosisYear: diagnosisYear || undefined, story, permissionToContact });
        res.status(201).json({ success: true, storySubmission: { id: storySubmission._id } });
    } catch (error) {
        console.error('Error submitting story:', error);
        res.status(500).json({ error: 'Failed to submit story' });
    }
};