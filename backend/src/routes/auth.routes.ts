import { Router } from 'express';
import { getAuthenticatedUser } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get the authenticated Firebase user and Bluely profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user
 *       401:
 *         description: Missing, invalid, or expired Firebase token
 */
router.get('/me', authMiddleware, getAuthenticatedUser);

export default router;
