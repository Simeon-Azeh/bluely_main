import { Router } from 'express';
import {
    createReading,
    getReadings,
    getReadingById,
    updateReading,
    deleteReading,
    getStats,
} from '../controllers/glucose.controller';

const router = Router();

// Glucose readings routes
router.post('/', createReading);
router.get('/', getReadings);
router.get('/stats', getStats);
router.get('/:id', getReadingById);
router.put('/:id', updateReading);
router.delete('/:id', deleteReading);

export default router;
