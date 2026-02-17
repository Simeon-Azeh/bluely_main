import { Router } from 'express';
import {
    logMood,
    getMoodLogs,
    getLatestMood,
    logLifestyle,
    getLifestyleLogs,
} from '../controllers/wellness.controller';

const router = Router();

/**
 * @swagger
 * /wellness/mood:
 *   post:
 *     summary: Log a mood entry
 *     tags: [Wellness]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firebaseUid
 *               - mood
 *               - period
 *             properties:
 *               firebaseUid:
 *                 type: string
 *               mood:
 *                 type: string
 *                 enum: [Great, Good, Okay, Low, Rough]
 *               period:
 *                 type: string
 *                 enum: [morning, afternoon, evening]
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Mood logged
 *       400:
 *         description: Validation error
 */
router.post('/mood', logMood);

/**
 * @swagger
 * /wellness/mood:
 *   get:
 *     summary: Get mood logs for a user
 *     tags: [Wellness]
 *     parameters:
 *       - in: query
 *         name: firebaseUid
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of mood logs
 */
router.get('/mood', getMoodLogs);

/**
 * @swagger
 * /wellness/mood/latest:
 *   get:
 *     summary: Get the latest mood entry for a user
 *     tags: [Wellness]
 *     parameters:
 *       - in: query
 *         name: firebaseUid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Latest mood entry
 */
router.get('/mood/latest', getLatestMood);

/**
 * @swagger
 * /wellness/lifestyle:
 *   post:
 *     summary: Log a lifestyle check-in
 *     tags: [Wellness]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firebaseUid
 *               - exerciseFrequency
 *               - sleepQuality
 *               - stressLevel
 *             properties:
 *               firebaseUid:
 *                 type: string
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
 *     responses:
 *       201:
 *         description: Lifestyle check-in logged
 *       400:
 *         description: Validation error
 */
router.post('/lifestyle', logLifestyle);

/**
 * @swagger
 * /wellness/lifestyle:
 *   get:
 *     summary: Get lifestyle check-in logs for a user
 *     tags: [Wellness]
 *     parameters:
 *       - in: query
 *         name: firebaseUid
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of lifestyle logs
 */
router.get('/lifestyle', getLifestyleLogs);

export default router;
