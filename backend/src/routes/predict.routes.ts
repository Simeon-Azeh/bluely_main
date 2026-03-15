import { Router } from 'express';
import {
    getPrediction,
    getPredictions,
    getLatestPrediction,
    getTrends,
    getGlucose30,
    getForecastHistory,
    getHbA1cEstimate,
    getWeeklyAnalysis,
    getDiaBuddySummary,
    chatWithDiaBuddy,
    updatePersonalization,
    getPersonalizationProfile,
    quickLogData,
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

/**
 * @swagger
 * /predict/glucose-30:
 *   get:
 *     summary: Get 30-minute glucose forecast
 *     tags: [Predictions]
 *     parameters:
 *       - in: query
 *         name: firebaseUid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 30-minute glucose prediction with direction
 */
router.get('/glucose-30', getGlucose30);

/**
 * @swagger
 * /predict/forecast-history:
 *   get:
 *     summary: Get forecast prediction history
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
 *           default: 20
 *     responses:
 *       200:
 *         description: List of saved forecasts
 */
router.get('/forecast-history', getForecastHistory);

/**
 * @swagger
 * /predict/estimate-hba1c:
 *   get:
 *     summary: Estimate HbA1c from glucose readings
 *     tags: [Predictions]
 *     parameters:
 *       - in: query
 *         name: firebaseUid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: HbA1c estimation result
 */
router.get('/estimate-hba1c', getHbA1cEstimate);

/**
 * @swagger
 * /predict/analyze-weekly:
 *   get:
 *     summary: Weekly glucose analysis with time-in-range
 *     tags: [Predictions]
 *     parameters:
 *       - in: query
 *         name: firebaseUid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Weekly analysis result
 */
router.get('/analyze-weekly', getWeeklyAnalysis);

/**
 * @swagger
 * /predict/diabuddy/summarize:
 *   get:
 *     summary: Get DiaBuddy AI health summary
 *     tags: [Predictions]
 *     parameters:
 *       - in: query
 *         name: firebaseUid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: AI-generated health summary
 */
router.get('/diabuddy/summarize', getDiaBuddySummary);

/**
 * @swagger
 * /predict/personalization/update:
 *   post:
 *     summary: Update patient personalization parameters
 *     tags: [Predictions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firebaseUid
 *               - predictedGlucose
 *               - actualGlucose
 *             properties:
 *               firebaseUid:
 *                 type: string
 *               predictedGlucose:
 *                 type: number
 *               actualGlucose:
 *                 type: number
 *     responses:
 *       200:
 *         description: Personalization update result
 */
router.post('/personalization/update', updatePersonalization);

/**
 * @swagger
 * /predict/personalization/profile:
 *   get:
 *     summary: Get patient personalization profile
 *     tags: [Predictions]
 *     parameters:
 *       - in: query
 *         name: firebaseUid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Personalization profile data
 */
router.get('/personalization/profile', getPersonalizationProfile);

/**
 * @swagger
 * /predict/diabuddy/chat:
 *   post:
 *     summary: Chat with DiaBuddy AI assistant
 *     tags: [Predictions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firebaseUid
 *               - message
 *             properties:
 *               firebaseUid:
 *                 type: string
 *               message:
 *                 type: string
 *               history:
 *                 type: array
 *     responses:
 *       200:
 *         description: DiaBuddy chat response
 */
router.post('/diabuddy/chat', chatWithDiaBuddy);

/**
 * @swagger
 * /predict/quick-log:
 *   post:
 *     summary: Quick-log missing data without navigating away
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
 *               glucose:
 *                 type: object
 *                 properties:
 *                   value:
 *                     type: number
 *                   unit:
 *                     type: string
 *               meal:
 *                 type: object
 *                 properties:
 *                   carbsEstimate:
 *                     type: number
 *                   mealType:
 *                     type: string
 *               medication:
 *                 type: object
 *                 properties:
 *                   dose:
 *                     type: number
 *                   medicationType:
 *                     type: string
 *               activity:
 *                 type: object
 *                 properties:
 *                   activityLevel:
 *                     type: string
 *     responses:
 *       200:
 *         description: Data logged and safety check updated
 */
router.post('/quick-log', quickLogData);

export default router;
