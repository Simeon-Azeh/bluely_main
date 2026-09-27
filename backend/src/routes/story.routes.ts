import { Router } from 'express';
import { submitStory } from '../controllers/story.controller';

const router = Router();
router.post('/', submitStory);

export default router;