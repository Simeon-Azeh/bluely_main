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

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firebaseUid
 *               - email
 *               - displayName
 *             properties:
 *               firebaseUid:
 *                 type: string
 *                 description: Firebase User ID
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *               displayName:
 *                 type: string
 *                 description: User display name
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       200:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', createUser);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get user by Firebase UID
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: firebaseUid
 *         required: true
 *         schema:
 *           type: string
 *         description: Firebase User ID
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Missing firebaseUid parameter
 *       404:
 *         description: User not found
 */
router.get('/', getUser);

/**
 * @swagger
 * /users:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firebaseUid
 *             properties:
 *               firebaseUid:
 *                 type: string
 *               displayName:
 *                 type: string
 *               diabetesType:
 *                 type: string
 *                 enum: [type1, type2, gestational, prediabetes, other]
 *               diagnosisYear:
 *                 type: number
 *               preferredUnit:
 *                 type: string
 *                 enum: [mg/dL, mmol/L]
 *               targetGlucoseMin:
 *                 type: number
 *               targetGlucoseMax:
 *                 type: number
 *               onboardingCompleted:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Missing firebaseUid
 *       404:
 *         description: User not found
 */
router.put('/', updateUser);

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 */
router.get('/me', authMiddleware, getCurrentUser);

/**
 * @swagger
 * /users/me:
 *   delete:
 *     summary: Delete current user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 */
router.delete('/me', authMiddleware, deleteUser);

export default router;
