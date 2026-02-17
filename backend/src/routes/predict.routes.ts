import { Router } from 'express';
import {
    getPrediction,
    getPredictions,
    getLatestPrediction,
    getTrends,
} from '../controllers/predict.controller';

const router = Router();

/**
 * @swagger
 * /predict:
 *   post:
 *     summary: Request a glucose risk prediction
 *     tags: [Predictions]
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
 *         description: Prediction result
 *       404:
 *         description: User not found
 */
router.post('/', getPrediction);

/**
 * @swagger
 * /predict/history:
 *   get:
 *     summary: Get prediction history
 *     tags: [Predictions]
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
 *           default: 10
 *     responses:
 *       200:
 *         description: List of predictions
 */
router.get('/history', getPredictions);

/**
 * @swagger
 * /predict/latest:
 *   get:
 *     summary: Get the latest prediction
 *     tags: [Predictions]
 *     parameters:
 *       - in: query
 *         name: firebaseUid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Latest prediction
 */
router.get('/latest', getLatestPrediction);

/**
 * @swagger
 * /predict/trends:
 *   get:
 *     summary: Get weekly glucose trend analysis
 *     tags: [Predictions]
 *     parameters:
 *       - in: query
 *         name: firebaseUid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trend analysis data
 */
router.get('/trends', getTrends);

export default router;
