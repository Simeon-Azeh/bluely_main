import { Request, Response } from 'express';
import { Medication, MedicationLog, User } from '../models';
import type { IMedicationLog } from '../models/MedicationLog';

// Create a medication
export const createMedication = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            firebaseUid,
            medicationName,
            medicationType,
            dosage,
            doseUnit,
            frequency,
            isInjectable,
            prescribedBy,
            notes,
        } = req.body;

        if (!firebaseUid || !medicationName || !medicationType || dosage === undefined) {
            res.status(400).json({ error: 'firebaseUid, medicationName, medicationType, and dosage are required' });
            return;
        }

        const user = await User.findOne({ firebaseUid });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const medication = await Medication.create({
            userId: user._id,
            firebaseUid,
            medicationName,
            medicationType,
            dosage,
            doseUnit: doseUnit || 'units',
            frequency: frequency || 'once_daily',
            isInjectable: isInjectable || false,
            prescribedBy,
            notes,
        });

        res.status(201).json(medication);
    } catch (error) {
        console.error('Error creating medication:', error);
        res.status(500).json({ error: 'Failed to create medication' });
    }
};

// Get medications for a user
export const getMedications = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firebaseUid, activeOnly = 'true' } = req.query;

        if (!firebaseUid) {
            res.status(400).json({ error: 'firebaseUid is required' });
            return;
        }

        const query: Record<string, unknown> = { firebaseUid: firebaseUid as string };
        if (activeOnly === 'true') {
            query.isActive = true;
        }

        const medications = await Medication.find(query).sort({ createdAt: -1 });

        res.status(200).json({ medications });
    } catch (error) {
        console.error('Error fetching medications:', error);
        res.status(500).json({ error: 'Failed to fetch medications' });
    }
};

// Update a medication
export const updateMedication = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const medication = await Medication.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });

        if (!medication) {
            res.status(404).json({ error: 'Medication not found' });
            return;
        }

        res.status(200).json(medication);
    } catch (error) {
        console.error('Error updating medication:', error);
        res.status(500).json({ error: 'Failed to update medication' });
    }
};

// Delete (deactivate) a medication
export const deleteMedication = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const deleted = await Medication.findByIdAndDelete(id);

        if (!deleted) {
            res.status(404).json({ error: 'Medication not found' });
            return;
        }

        res.status(200).json({ message: 'Medication removed successfully' });
    } catch (error) {
        console.error('Error deleting medication:', error);
        res.status(500).json({ error: 'Failed to delete medication' });
    }
};

// Log a medication dose
export const logMedicationDose = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            firebaseUid,
            medicationName,
            medicationType,
            dosage,
            doseUnit,
            injectionSite,
            glucoseReadingId,
            takenAt,
            notes,
        } = req.body;

        if (!firebaseUid || !medicationName || !medicationType || dosage === undefined) {
            res.status(400).json({ error: 'firebaseUid, medicationName, medicationType, and dosage are required' });
            return;
        }

        const user = await User.findOne({ firebaseUid });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const log = await MedicationLog.create({
            userId: user._id,
            firebaseUid,
            medicationName,
            medicationType,
            dosage,
            doseUnit: doseUnit || 'units',
            injectionSite,
            glucoseReadingId,
            takenAt: takenAt ? new Date(takenAt) : new Date(),
            notes,
        });

        res.status(201).json(log);
    } catch (error) {
        console.error('Error logging medication dose:', error);
        res.status(500).json({ error: 'Failed to log medication dose' });
    }
};

// Get medication logs
export const getMedicationLogs = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firebaseUid, limit = '50', page = '1' } = req.query;

        if (!firebaseUid) {
            res.status(400).json({ error: 'firebaseUid is required' });
            return;
        }

        const limitNum = parseInt(limit as string);
        const pageNum = parseInt(page as string);
        const skip = (pageNum - 1) * limitNum;

        const [logs, total] = await Promise.all([
            MedicationLog.find({ firebaseUid: firebaseUid as string })
                .sort({ takenAt: -1 })
                .skip(skip)
                .limit(limitNum),
            MedicationLog.countDocuments({ firebaseUid: firebaseUid as string }),
        ]);

        res.status(200).json({
            logs,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.error('Error fetching medication logs:', error);
        res.status(500).json({ error: 'Failed to fetch medication logs' });
    }
};

// Get injection site recommendation
export const getInjectionSiteRecommendation = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firebaseUid } = req.query;

        if (!firebaseUid) {
            res.status(400).json({ error: 'firebaseUid is required' });
            return;
        }

        const allSites = ['abdomen', 'thigh_left', 'thigh_right', 'arm_left', 'arm_right', 'buttock'];

        // Get recent injection logs
        const recentLogs = await MedicationLog.find({
            firebaseUid: firebaseUid as string,
            injectionSite: { $exists: true, $ne: null },
        })
            .sort({ takenAt: -1 })
            .limit(100);

        // Build site usage map
        const siteUsage: Record<string, { count: number; lastUsed: string | null }> = {};
        allSites.forEach((site) => {
            siteUsage[site] = { count: 0, lastUsed: null };
        });

        recentLogs.forEach((log: IMedicationLog) => {
            const site = log.injectionSite as string;
            if (siteUsage[site]) {
                siteUsage[site].count++;
                if (!siteUsage[site].lastUsed) {
                    siteUsage[site].lastUsed = log.takenAt.toISOString();
                }
            }
        });

        // Find least-used site
        const lastUsedSite = recentLogs.length > 0 ? (recentLogs[0].injectionSite || null) : null;
        const sortedSites = allSites.sort((a, b) => siteUsage[a].count - siteUsage[b].count);
        let recommendedSite = sortedSites[0];

        // Avoid the last used site if possible
        if (recommendedSite === lastUsedSite && sortedSites.length > 1) {
            recommendedSite = sortedSites[1];
        }

        const siteLabels: Record<string, string> = {
            abdomen: 'Abdomen',
            thigh_left: 'Left Thigh',
            thigh_right: 'Right Thigh',
            arm_left: 'Left Arm',
            arm_right: 'Right Arm',
            buttock: 'Buttock',
        };

        res.status(200).json({
            recommendedSite,
            lastUsedSite,
            siteUsage,
            totalInjections: recentLogs.length,
            tip: `Rotating injection sites helps prevent lipodystrophy. Try ${siteLabels[recommendedSite] || recommendedSite} for your next injection.`,
        });
    } catch (error) {
        console.error('Error getting injection site recommendation:', error);
        res.status(500).json({ error: 'Failed to get injection site recommendation' });
    }
};
