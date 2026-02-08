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

/**
 * @swagger
 * /glucose:
 *   post:
 *     summary: Create a new glucose reading
 *     tags: [Glucose]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firebaseUid
 *               - value
 *             properties:
 *               firebaseUid:
 *                 type: string
 *                 description: Firebase User ID
 *               value:
 *                 type: number
 *                 description: Glucose reading value
 *               unit:
 *                 type: string
 *                 enum: [mg/dL, mmol/L]
 *                 default: mg/dL
 *               readingType:
 *                 type: string
 *                 enum: [fasting, before_meal, after_meal, bedtime, random]
 *                 default: random
 *               mealContext:
 *                 type: string
 *                 description: Meal context information
 *               activityContext:
 *                 type: string
 *                 description: Activity context information
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *               recordedAt:
 *                 type: string
 *                 format: date-time
 *                 description: When the reading was taken
 *     responses:
 *       201:
 *         description: Glucose reading created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GlucoseReading'
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: User not found
 */
router.post('/', createReading);

/**
 * @swagger
 * /glucose:
 *   get:
 *     summary: Get glucose readings for a user
 *     tags: [Glucose]
 *     parameters:
 *       - in: query
 *         name: firebaseUid
 *         required: true
 *         schema:
 *           type: string
 *         description: Firebase User ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter readings from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter readings until this date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of readings to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *     responses:
 *       200:
 *         description: List of glucose readings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 readings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GlucoseReading'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       400:
 *         description: Missing firebaseUid parameter
 */
router.get('/', getReadings);

/**
 * @swagger
 * /glucose/stats:
 *   get:
 *     summary: Get glucose statistics for a user
 *     tags: [Glucose]
 *     parameters:
 *       - in: query
 *         name: firebaseUid
 *         required: true
 *         schema:
 *           type: string
 *         description: Firebase User ID
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Number of days to calculate stats for
 *     responses:
 *       200:
 *         description: Glucose statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GlucoseStats'
 *       400:
 *         description: Missing firebaseUid parameter
 *       404:
 *         description: User not found
 */
router.get('/stats', getStats);

/**
 * @swagger
 * /glucose/{id}:
 *   get:
 *     summary: Get a specific glucose reading
 *     tags: [Glucose]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Glucose reading ID
 *     responses:
 *       200:
 *         description: Glucose reading found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GlucoseReading'
 *       404:
 *         description: Glucose reading not found
 */
router.get('/:id', getReadingById);

/**
 * @swagger
 * /glucose/{id}:
 *   put:
 *     summary: Update a glucose reading
 *     tags: [Glucose]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Glucose reading ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: number
 *               unit:
 *                 type: string
 *                 enum: [mg/dL, mmol/L]
 *               readingType:
 *                 type: string
 *                 enum: [fasting, before_meal, after_meal, bedtime, random]
 *               mealContext:
 *                 type: string
 *               activityContext:
 *                 type: string
 *               notes:
 *                 type: string
 *               recordedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Glucose reading updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GlucoseReading'
 *       404:
 *         description: Glucose reading not found
 */
router.put('/:id', updateReading);

/**
 * @swagger
 * /glucose/{id}:
 *   delete:
 *     summary: Delete a glucose reading
 *     tags: [Glucose]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Glucose reading ID
 *     responses:
 *       200:
 *         description: Glucose reading deleted
 *       404:
 *         description: Glucose reading not found
 */
router.delete('/:id', deleteReading);

export default router;
