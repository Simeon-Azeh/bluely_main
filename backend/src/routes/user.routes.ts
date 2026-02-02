import { Router } from 'express';
import {
    createUser,
    getUser,
    getCurrentUser,
    updateUser,
    deleteUser,
} from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/', createUser);
router.get('/', getUser);
router.put('/', updateUser);

// Protected routes
router.get('/me', authMiddleware, getCurrentUser);
router.delete('/me', authMiddleware, deleteUser);

export default router;
