import { Router } from 'express';
import { createActivity, getActivities, deleteActivity } from '../controllers/activity.controller';

const router = Router();

/**
 * @swagger
 * /activities:
 *   post:
 *     summary: Log an activity
 *     tags: [Activities]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firebaseUid
 *               - activityLevel
 *             properties:
 *               firebaseUid:
 *                 type: string
 *               activityLevel:
 *                 type: string
 *                 enum: [low, medium, high]
 *               activityType:
 *                 type: string
 *                 enum: [walking, running, gym, sports, other]
 *               durationMinutes:
 *                 type: number
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Activity logged successfully
 *       400:
 *         description: Validation error
 */
router.post('/', createActivity);

/**
 * @swagger
 * /activities:
 *   get:
 *     summary: Get activities for a user
 *     tags: [Activities]
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
 *           default: 50
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: List of activities
 */
router.get('/', getActivities);

/**
 * @swagger
 * /activities/{id}:
 *   delete:
 *     summary: Delete an activity
 *     tags: [Activities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Activity deleted
 *       404:
 *         description: Activity not found
 */
router.delete('/:id', deleteActivity);

export default router;
