import { Router } from 'express';
import {
    createMedication,
    getMedications,
    updateMedication,
    deleteMedication,
    logMedicationDose,
    getMedicationLogs,
    getInjectionSiteRecommendation,
} from '../controllers/medication.controller';

const router = Router();

/**
 * @swagger
 * /medications:
 *   post:
 *     summary: Add a medication to the user's regimen
 *     tags: [Medications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firebaseUid
 *               - medicationName
 *               - medicationType
 *               - dosage
 *             properties:
 *               firebaseUid:
 *                 type: string
 *               medicationName:
 *                 type: string
 *               medicationType:
 *                 type: string
 *               dosage:
 *                 type: number
 *               doseUnit:
 *                 type: string
 *               frequency:
 *                 type: string
 *               isInjectable:
 *                 type: boolean
 *               prescribedBy:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Medication created
 *       400:
 *         description: Validation error
 */
router.post('/', createMedication);

/**
 * @swagger
 * /medications:
 *   get:
 *     summary: Get medications for a user
 *     tags: [Medications]
 *     parameters:
 *       - in: query
 *         name: firebaseUid
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: List of medications
 */
router.get('/', getMedications);

/**
 * @swagger
 * /medications/log:
 *   post:
 *     summary: Log a medication dose
 *     tags: [Medications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firebaseUid
 *               - medicationName
 *               - medicationType
 *               - dosage
 *             properties:
 *               firebaseUid:
 *                 type: string
 *               medicationName:
 *                 type: string
 *               medicationType:
 *                 type: string
 *               dosage:
 *                 type: number
 *               doseUnit:
 *                 type: string
 *               injectionSite:
 *                 type: string
 *               glucoseReadingId:
 *                 type: string
 *               takenAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Dose logged
 */
router.post('/log', logMedicationDose);

/**
 * @swagger
 * /medications/logs:
 *   get:
 *     summary: Get medication dose logs
 *     tags: [Medications]
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
 *     responses:
 *       200:
 *         description: List of medication dose logs
 */
router.get('/logs', getMedicationLogs);

/**
 * @swagger
 * /medications/injection-sites:
 *   get:
 *     summary: Get injection site recommendation
 *     tags: [Medications]
 *     parameters:
 *       - in: query
 *         name: firebaseUid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Injection site recommendation with usage stats
 */
router.get('/injection-sites', getInjectionSiteRecommendation);

/**
 * @swagger
 * /medications/{id}:
 *   put:
 *     summary: Update a medication
 *     tags: [Medications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Medication updated
 *       404:
 *         description: Medication not found
 */
router.put('/:id', updateMedication);

/**
 * @swagger
 * /medications/{id}:
 *   delete:
 *     summary: Delete a medication
 *     tags: [Medications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Medication deleted
 *       404:
 *         description: Medication not found
 */
router.delete('/:id', deleteMedication);

export default router;
