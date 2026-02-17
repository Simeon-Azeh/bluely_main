import { Router } from 'express';
import {
    getHealthProfile,
    upsertHealthProfile,
    dismissPrompt,
} from '../controllers/healthProfile.controller';

const router = Router();

/**
 * @swagger
 * /health-profile:
 *   get:
 *     summary: Get user health profile
 *     tags: [Health Profile]
 *     parameters:
 *       - in: query
 *         name: firebaseUid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Health profile data
 */
router.get('/', getHealthProfile);

/**
 * @swagger
 * /health-profile:
 *   post:
 *     summary: Create or update health profile
 *     tags: [Health Profile]
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
 *               activityLevel:
 *                 type: string
 *                 enum: [low, medium, high]
 *               exerciseFrequency:
 *                 type: string
 *                 enum: [rare, moderate, frequent]
 *               sleepQuality:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               stressLevel:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               mealPreference:
 *                 type: string
 *                 enum: [home_cooked, processed, mixed]
 *               onMedication:
 *                 type: boolean
 *               medicationCategory:
 *                 type: string
 *                 enum: [none, insulin, oral, other]
 *               medicationFrequency:
 *                 type: string
 *                 enum: [daily, occasionally, none]
 *     responses:
 *       200:
 *         description: Health profile updated
 *       404:
 *         description: User not found
 */
router.post('/', upsertHealthProfile);

/**
 * @swagger
 * /health-profile/dismiss:
 *   post:
 *     summary: Dismiss a data collection prompt
 *     tags: [Health Profile]
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
 *     responses:
 *       200:
 *         description: Prompt dismissed
 */
router.post('/dismiss', dismissPrompt);

export default router;
