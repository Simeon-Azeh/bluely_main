import { Router } from 'express';
import { submitContactMessage, submitVolunteerApplication } from '../controllers/community.controller';

const router = Router();
router.post('/contact', submitContactMessage);
router.post('/volunteer', submitVolunteerApplication);

export default router;