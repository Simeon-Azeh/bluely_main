import { Router } from 'express';
import { createMeal, getMeals, deleteMeal } from '../controllers/meal.controller';

const router = Router();

/**
 * @swagger
 * /meals:
 *   post:
 *     summary: Log a meal
 *     tags: [Meals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firebaseUid
 *               - mealType
 *             properties:
 *               firebaseUid:
 *                 type: string
 *               carbsEstimate:
 *                 type: number
 *               mealType:
 *                 type: string
 *                 enum: [breakfast, lunch, dinner, snack]
 *               mealCategory:
 *                 type: string
 *                 enum: [home_cooked, processed, restaurant, other]
 *               description:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Meal logged successfully
 *       400:
 *         description: Validation error
 */
router.post('/', createMeal);

/**
 * @swagger
 * /meals:
 *   get:
 *     summary: Get meals for a user
 *     tags: [Meals]
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
 *         description: List of meals
 */
router.get('/', getMeals);

/**
 * @swagger
 * /meals/{id}:
 *   delete:
 *     summary: Delete a meal
 *     tags: [Meals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Meal deleted
 *       404:
 *         description: Meal not found
 */
router.delete('/:id', deleteMeal);

export default router;
