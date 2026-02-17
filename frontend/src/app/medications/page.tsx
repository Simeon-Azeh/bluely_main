'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, Button } from '@/components/ui';
import {
    FiPlus, FiTrash2, FiClock, FiEdit2, FiChevronDown,
    FiChevronUp, FiAlertCircle, FiCheckCircle, FiInfo, FiMinusCircle,
} from 'react-icons/fi';
import { TbVaccine, TbPill, TbTargetArrow } from 'react-icons/tb';

const medicationTypes = [
    { value: 'insulin_rapid', label: 'Rapid-Acting Insulin' },
    { value: 'insulin_long', label: 'Long-Acting Insulin' },
    { value: 'insulin_mixed', label: 'Mixed Insulin' },
    { value: 'metformin', label: 'Metformin' },
    { value: 'sulfonylurea', label: 'Sulfonylurea' },
    { value: 'other', label: 'Other' },
];

const frequencies = [
    { value: 'once_daily', label: 'Once daily' },
    { value: 'twice_daily', label: 'Twice daily' },
    { value: 'three_daily', label: 'Three times daily' },
    { value: 'before_meals', label: 'Before meals' },
    { value: 'after_meals', label: 'After meals' },
    { value: 'at_bedtime', label: 'At bedtime' },
    { value: 'as_needed', label: 'As needed' },
];

const injectionSites = [
    { value: 'abdomen', label: 'Abdomen' },
    { value: 'thigh_left', label: 'Left Thigh' },
    { value: 'thigh_right', label: 'Right Thigh' },
    { value: 'arm_left', label: 'Left Arm' },
    { value: 'arm_right', label: 'Right Arm' },
    { value: 'buttock', label: 'Buttock' },
];

interface Medication {
    _id: string;
    medicationName: string;
    medicationType: string;
    dosage: number;
    doseUnit: string;
    frequency: string;
    isInjectable: boolean;
    isActive: boolean;
    prescribedBy?: string;
    notes?: string;
    createdAt: string;
}

interface MedicationLog {
    _id: string;
    medicationName: string;
    medicationType: string;
    dosage: number;
    doseUnit: string;
    injectionSite?: string;
    takenAt: string;
    createdAt: string;
}

export default function MedicationsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [medications, setMedications] = useState<Medication[]>([]);
    const [logs, setLogs] = useState<MedicationLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showLogForm, setShowLogForm] = useState(false);
    const [selectedMed, setSelectedMed] = useState<Medication | null>(null);
    const [showLogs, setShowLogs] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [siteRecommendation, setSiteRecommendation] = useState<string | null>(null);
    const [siteUsage, setSiteUsage] = useState<Record<string, { count: number; lastUsed: string | null }>>({});
    const [editingMed, setEditingMed] = useState<Medication | null>(null);

    // Add form state
    const [form, setForm] = useState({
        medicationName: '',
        medicationType: 'metformin',
        dosage: '',
        doseUnit: 'mg',
        frequency: 'once_daily',
        isInjectable: false,
        preferredInjectionSite: '',
        prescribedBy: '',
        notes: '',
    });

    // Log dose form state
    const [logForm, setLogForm] = useState({
        dosage: '',
        injectionSite: '',
    });

    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);

    const fetchMedications = useCallback(async () => {
        if (!user) return;
        try {
            const res = await api.getMedications(user.uid);
            setMedications(res.medications || []);
        } catch (err) {
            console.error('Failed to load medications:', err);
        }
    }, [user]);

    const fetchLogs = useCallback(async () => {
        if (!user) return;
        try {
            const res = await api.getMedicationLogs(user.uid, 30);
            setLogs(res.logs || []);
        } catch (err) {
            console.error('Failed to load medication logs:', err);
        }
    }, [user]);

    const fetchSiteRecommendation = useCallback(async () => {
        if (!user) return;
        try {
            const res = await api.getInjectionSiteRecommendation(user.uid);
            setSiteRecommendation(res.recommendedSite);
            setSiteUsage(res.siteUsage || {});
        } catch {
            // Not critical
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            Promise.all([fetchMedications(), fetchLogs(), fetchSiteRecommendation()])
                .finally(() => setLoading(false));
        }
    }, [user, fetchMedications, fetchLogs, fetchSiteRecommendation]);

    const handleAddMedication = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setError('');

        try {
            await api.createMedication({
                firebaseUid: user.uid,
                medicationName: form.medicationName,
                medicationType: form.medicationType,
                dosage: Number(form.dosage),
                doseUnit: form.doseUnit,
                frequency: form.frequency,
                isInjectable: form.isInjectable,
                prescribedBy: form.prescribedBy || undefined,
                notes: form.notes || undefined,
            });
            setSuccess('Medication added!');
            setShowAddForm(false);
            setForm({
                medicationName: '',
                medicationType: 'metformin',
                dosage: '',
                doseUnit: 'mg',
                frequency: 'once_daily',
                isInjectable: false,
                preferredInjectionSite: '',
                prescribedBy: '',
                notes: '',
            });
            fetchMedications();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add medication');
        }
    };

    const handleEditMedication = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMed) return;
        setError('');

        try {
            await api.updateMedication(editingMed._id, {
                medicationName: form.medicationName,
                medicationType: form.medicationType,
                dosage: Number(form.dosage),
                doseUnit: form.doseUnit,
                frequency: form.frequency,
                isInjectable: form.isInjectable,
                prescribedBy: form.prescribedBy || undefined,
                notes: form.notes || undefined,
            });
            setSuccess('Medication updated!');
            setEditingMed(null);
            setShowAddForm(false);
            setForm({
                medicationName: '',
                medicationType: 'metformin',
                dosage: '',
                doseUnit: 'mg',
                frequency: 'once_daily',
                isInjectable: false,
                preferredInjectionSite: '',
                prescribedBy: '',
                notes: '',
            });
            fetchMedications();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update medication');
        }
    };

    const openEditForm = (med: Medication) => {
        setForm({
            medicationName: med.medicationName,
            medicationType: med.medicationType,
            dosage: String(med.dosage),
            doseUnit: med.doseUnit,
            frequency: med.frequency,
            isInjectable: med.isInjectable,
            preferredInjectionSite: '',
            prescribedBy: med.prescribedBy || '',
            notes: med.notes || '',
        });
        setEditingMed(med);
        setShowAddForm(true);
    };

    const handleLogDose = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !selectedMed) return;
        setError('');

        try {
            await api.logMedication({
                firebaseUid: user.uid,
                medicationName: selectedMed.medicationName,
                medicationType: selectedMed.medicationType,
                dosage: Number(logForm.dosage || selectedMed.dosage),
                doseUnit: selectedMed.doseUnit,
                injectionSite: selectedMed.isInjectable ? logForm.injectionSite || undefined : undefined,
            });
            setSuccess('Dose logged!');
            setShowLogForm(false);
            setSelectedMed(null);
            setLogForm({ dosage: '', injectionSite: '' });
            fetchLogs();
            fetchSiteRecommendation();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to log dose');
        }
    };

    const handleDeactivate = async (med: Medication) => {
        try {
            await api.updateMedication(med._id, { isActive: false });
            setSuccess('Medication deactivated');
            fetchMedications();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to deactivate');
        }
    };

    const handleDelete = async (med: Medication) => {
        if (!confirm(`Delete "${med.medicationName}" permanently?`)) return;
        try {
            await api.deleteMedication(med._id);
            setSuccess('Medication deleted');
            fetchMedications();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete');
        }
    };

    const isInsulinType = (type: string) => type.startsWith('insulin');

    // Compute today's dose summary per medication
    const todayDoseSummary = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayLogs = logs.filter((l) => new Date(l.takenAt) >= today);
        const summary: Record<string, { totalDose: number; count: number; doseUnit: string; perDose: number }> = {};
        todayLogs.forEach((log) => {
            if (!summary[log.medicationName]) {
                summary[log.medicationName] = { totalDose: 0, count: 0, doseUnit: log.doseUnit, perDose: log.dosage };
            }
            summary[log.medicationName].totalDose += log.dosage;
            summary[log.medicationName].count += 1;
            summary[log.medicationName].perDose = log.dosage; // last dose
        });
        return summary;
    }, [logs]);

    const getMedTypeLabel = (type: string): string => {
        const found = medicationTypes.find((t) => t.value === type);
        return found ? found.label : type;
    };

    const getFrequencyLabel = (freq: string): string => {
        const found = frequencies.find((f) => f.value === freq);
        return found ? found.label : freq.replace(/_/g, ' ');
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#1F2F98] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24 md:pb-8">
            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Medications</h1>
                        <p className="text-sm text-gray-500">Manage your medication regimen</p>
                    </div>
                    <Button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="bg-[#1F2F98] hover:bg-[#1F2F98]/90 text-white rounded-xl px-4 py-2 flex items-center gap-2 text-sm"
                    >
                        <FiPlus className="w-4 h-4" />
                        Add
                    </Button>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
                        <FiAlertCircle className="shrink-0" />
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-sm text-green-700">
                        <FiCheckCircle className="shrink-0" />
                        {success}
                    </div>
                )}

                {/* Add Medication Form */}
                {showAddForm && (
                    <Card className="mb-6 border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                        <CardContent>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                {editingMed ? 'Edit Medication' : 'New Medication'}
                            </h2>
                            <form onSubmit={editingMed ? handleEditMedication : handleAddMedication} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Medication Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={form.medicationName}
                                        onChange={(e) => setForm({ ...form, medicationName: e.target.value })}
                                        placeholder="e.g. Metformin, Lantus"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F2F98]/20 focus:border-[#1F2F98]"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Type
                                        </label>
                                        <select
                                            value={form.medicationType}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setForm({
                                                    ...form,
                                                    medicationType: val,
                                                    isInjectable: val.startsWith('insulin'),
                                                    doseUnit: val.startsWith('insulin') ? 'units' : 'mg',
                                                });
                                            }}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F2F98]/20 focus:border-[#1F2F98]"
                                        >
                                            {medicationTypes.map((t) => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Dosage per dose
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                required
                                                min={0}
                                                value={form.dosage}
                                                onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                                                placeholder="e.g. 10"
                                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F2F98]/20 focus:border-[#1F2F98]"
                                            />
                                            <select
                                                value={form.doseUnit}
                                                onChange={(e) => setForm({ ...form, doseUnit: e.target.value })}
                                                className="w-24 px-2 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F2F98]/20 focus:border-[#1F2F98]"
                                            >
                                                <option value="units">Units</option>
                                                <option value="IU">IU</option>
                                                <option value="mg">mg</option>
                                                <option value="mcg">mcg</option>
                                                <option value="ml">mL</option>
                                            </select>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">Amount you take each time (single dose)</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Frequency
                                    </label>
                                    <select
                                        value={form.frequency}
                                        onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F2F98]/20 focus:border-[#1F2F98]"
                                    >
                                        {frequencies.map((f) => (
                                            <option key={f.value} value={f.value}>{f.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Injection Site Section — only for injectable medications */}
                                {form.isInjectable && (
                                    <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl space-y-3">
                                        <div className="flex items-center gap-2">
                                            <TbTargetArrow className="w-4 h-4 text-[#1F2F98]" />
                                            <span className="text-sm font-medium text-gray-800">Injection Site Preference</span>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-2">Preferred injection site</label>
                                            <select
                                                value={form.preferredInjectionSite}
                                                onChange={(e) => setForm({ ...form, preferredInjectionSite: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1F2F98]/20 focus:border-[#1F2F98]"
                                            >
                                                <option value="">Select preferred site...</option>
                                                {injectionSites.map((s) => (
                                                    <option key={s.value} value={s.value}>{s.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Site usage stats */}
                                        {Object.keys(siteUsage).length > 0 && (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-2">Your injection site history</label>
                                                <div className="grid grid-cols-2 gap-1.5">
                                                    {injectionSites.map((site) => {
                                                        const usage = siteUsage[site.value];
                                                        const count = usage?.count || 0;
                                                        const isRecommended = siteRecommendation === site.value;
                                                        return (
                                                            <div
                                                                key={site.value}
                                                                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs ${isRecommended
                                                                        ? 'bg-green-100 border border-green-200'
                                                                        : count > 5
                                                                            ? 'bg-orange-50 border border-orange-100'
                                                                            : 'bg-white border border-gray-100'
                                                                    }`}
                                                            >
                                                                <span className={isRecommended ? 'font-medium text-green-700' : 'text-gray-600'}>
                                                                    {site.label}
                                                                </span>
                                                                <span className={`font-medium ${isRecommended ? 'text-green-600' : count > 5 ? 'text-orange-600' : 'text-gray-500'
                                                                    }`}>
                                                                    {count}×
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                {siteRecommendation && (
                                                    <div className="flex items-start gap-1.5 mt-2 text-xs text-green-700">
                                                        <FiInfo className="w-3 h-3 mt-0.5 shrink-0" />
                                                        <span>
                                                            <strong>{injectionSites.find((s) => s.value === siteRecommendation)?.label}</strong> is recommended next — it has the fewest recent uses. Rotate sites to prevent lipohypertrophy.
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Prescribed By (optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={form.prescribedBy}
                                        onChange={(e) => setForm({ ...form, prescribedBy: e.target.value })}
                                        placeholder="Doctor name"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F2F98]/20 focus:border-[#1F2F98]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notes (optional)
                                    </label>
                                    <textarea
                                        value={form.notes}
                                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                        rows={2}
                                        placeholder="Additional instructions..."
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F2F98]/20 focus:border-[#1F2F98] resize-none"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-[#1F2F98] hover:bg-[#1F2F98]/90 text-white rounded-xl py-2.5 text-sm font-medium"
                                    >
                                        {editingMed ? 'Update Medication' : 'Add Medication'}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            setShowAddForm(false);
                                            setEditingMed(null);
                                            setForm({
                                                medicationName: '',
                                                medicationType: 'metformin',
                                                dosage: '',
                                                doseUnit: 'mg',
                                                frequency: 'once_daily',
                                                isInjectable: false,
                                                preferredInjectionSite: '',
                                                prescribedBy: '',
                                                notes: '',
                                            });
                                        }}
                                        className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Log Dose Modal */}
                {showLogForm && selectedMed && (
                    <Card className="mb-6 border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                        <CardContent>
                            <h2 className="text-lg font-semibold text-gray-900 mb-1">
                                Log Dose: {selectedMed.medicationName}
                            </h2>
                            <p className="text-xs text-gray-500 mb-4">
                                {getMedTypeLabel(selectedMed.medicationType)} &middot; {getFrequencyLabel(selectedMed.frequency)}
                            </p>
                            <form onSubmit={handleLogDose} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Dosage ({selectedMed.doseUnit})
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={logForm.dosage}
                                        onChange={(e) => setLogForm({ ...logForm, dosage: e.target.value })}
                                        placeholder={String(selectedMed.dosage)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F2F98]/20 focus:border-[#1F2F98]"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        Leave blank to use default ({selectedMed.dosage} {selectedMed.doseUnit})
                                    </p>
                                </div>

                                {selectedMed.isInjectable && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Injection Site
                                        </label>
                                        <select
                                            value={logForm.injectionSite}
                                            onChange={(e) => setLogForm({ ...logForm, injectionSite: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F2F98]/20 focus:border-[#1F2F98]"
                                        >
                                            <option value="">Select site...</option>
                                            {injectionSites.map((s) => (
                                                <option key={s.value} value={s.value}>{s.label}</option>
                                            ))}
                                        </select>
                                        {siteRecommendation && (
                                            <div className="mt-2 flex items-start gap-1.5 text-xs text-blue-600">
                                                <FiInfo className="w-3 h-3 mt-0.5 shrink-0" />
                                                <span>
                                                    Recommended: <strong>
                                                        {injectionSites.find((s) => s.value === siteRecommendation)?.label || siteRecommendation}
                                                    </strong> (least used recently)
                                                </span>
                                            </div>
                                        )}

                                        {/* Site usage breakdown */}
                                        {Object.keys(siteUsage).length > 0 && (
                                            <div className="mt-3">
                                                <label className="block text-xs font-medium text-gray-500 mb-1.5">Site usage (recent)</label>
                                                <div className="grid grid-cols-3 gap-1">
                                                    {injectionSites.map((site) => {
                                                        const count = siteUsage[site.value]?.count || 0;
                                                        const isRec = siteRecommendation === site.value;
                                                        return (
                                                            <div
                                                                key={site.value}
                                                                className={`text-center px-1.5 py-1 rounded text-xs ${isRec ? 'bg-green-50 text-green-700 font-medium' : count > 5 ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-500'
                                                                    }`}
                                                            >
                                                                {site.label.replace('Left ', 'L ').replace('Right ', 'R ')} <span className="font-semibold">{count}×</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-[#1F2F98] hover:bg-[#1F2F98]/90 text-white rounded-xl py-2.5 text-sm font-medium"
                                    >
                                        Log Dose
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => { setShowLogForm(false); setSelectedMed(null); }}
                                        className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Active Medications */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Active Medications</h2>
                    {medications.length === 0 ? (
                        <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                            <CardContent>
                                <div className="text-center py-8">
                                    <TbPill className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 text-sm">No medications added yet</p>
                                    <p className="text-gray-400 text-xs mt-1">
                                        Tap &ldquo;Add&rdquo; to start tracking your medications
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {medications.map((med) => (
                                <Card
                                    key={med._id}
                                    className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
                                >
                                    <CardContent>
                                        <div className="flex items-start gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isInsulinType(med.medicationType)
                                                ? 'bg-blue-100'
                                                : 'bg-purple-100'
                                                }`}>
                                                {isInsulinType(med.medicationType) ? (
                                                    <TbVaccine className="w-5 h-5 text-blue-600" />
                                                ) : (
                                                    <TbPill className="w-5 h-5 text-purple-600" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-semibold text-gray-900 truncate">
                                                        {med.medicationName}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedMed(med);
                                                                setLogForm({
                                                                    dosage: '',
                                                                    injectionSite: siteRecommendation || '',
                                                                });
                                                                setShowLogForm(true);
                                                            }}
                                                            className="p-1.5 text-[#1F2F98] hover:bg-[#1F2F98]/10 rounded-lg transition-colors"
                                                            title="Log dose"
                                                        >
                                                            <FiClock className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditForm(med)}
                                                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit medication"
                                                        >
                                                            <FiEdit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeactivate(med)}
                                                            className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                                            title="Deactivate"
                                                        >
                                                            <FiMinusCircle className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(med)}
                                                            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <FiTrash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {getMedTypeLabel(med.medicationType)}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-600">
                                                    <span className="font-medium">{med.dosage} {med.doseUnit}/dose</span>
                                                    <span className="text-gray-300">|</span>
                                                    <span>{getFrequencyLabel(med.frequency)}</span>
                                                </div>
                                                {med.prescribedBy && (
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Prescribed by {med.prescribedBy}
                                                    </p>
                                                )}
                                                {/* Today's dose summary */}
                                                {todayDoseSummary[med.medicationName] && (
                                                    <div className="mt-2 px-2.5 py-1.5 bg-blue-50 rounded-lg">
                                                        <p className="text-xs font-medium text-[#1F2F98]">
                                                            Today: {todayDoseSummary[med.medicationName].totalDose} {todayDoseSummary[med.medicationName].doseUnit} total
                                                            {todayDoseSummary[med.medicationName].count > 1 && (
                                                                <span className="font-normal text-blue-600">
                                                                    {' '}({todayDoseSummary[med.medicationName].perDose} {todayDoseSummary[med.medicationName].doseUnit} × {todayDoseSummary[med.medicationName].count} doses)
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Dose Logs */}
                <div>
                    <button
                        type="button"
                        onClick={() => setShowLogs(!showLogs)}
                        className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-3 w-full"
                    >
                        Recent Dose Logs
                        {showLogs ? (
                            <FiChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                            <FiChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                        <span className="ml-auto text-xs font-normal text-gray-400">
                            {logs.length} entries
                        </span>
                    </button>

                    {showLogs && (
                        <div className="space-y-2">
                            {logs.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4">No doses logged yet</p>
                            ) : (
                                logs.map((log) => (
                                    <div
                                        key={log._id}
                                        className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100"
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isInsulinType(log.medicationType)
                                            ? 'bg-blue-50'
                                            : 'bg-purple-50'
                                            }`}>
                                            {isInsulinType(log.medicationType) ? (
                                                <TbVaccine className="w-4 h-4 text-blue-500" />
                                            ) : (
                                                <TbPill className="w-4 h-4 text-purple-500" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {log.medicationName}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {log.dosage} {log.doseUnit}
                                                {log.injectionSite && ` · ${injectionSites.find((s) => s.value === log.injectionSite)?.label || log.injectionSite
                                                    }`}
                                            </p>
                                        </div>
                                        <p className="text-xs text-gray-400 shrink-0">
                                            {new Date(log.takenAt).toLocaleString([], {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: 'numeric',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
