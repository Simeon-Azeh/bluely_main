'use client';

import React, { useState, useEffect } from 'react';
import { FiCheck, FiX, FiEdit3, FiChevronDown, FiDroplet } from 'react-icons/fi';
import api from '@/lib/api';

export interface ActionProposal {
    type: string;
    data: Record<string, string>;
}

interface SavedMedication {
    _id: string;
    medicationName: string;
    medicationType: string;
    dosage: number;
    doseUnit: string;
    isInjectable: boolean;
    injectionSite?: string;
}

interface ChatLogCardProps {
    action: ActionProposal;
    firebaseUid: string;
    compact?: boolean;
    messageTimestamp?: number;
    onLogged?: (logType: 'glucose' | 'meal') => void;
}

const READING_TYPES = [
    { value: 'fasting', label: 'Fasting' },
    { value: 'before_meal', label: 'Before meal' },
    { value: 'after_meal', label: 'After meal' },
    { value: 'bedtime', label: 'Bedtime' },
    { value: 'random', label: 'Random' },
];

const MEAL_TYPES = [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snack' },
];

export default function ChatLogCard({ action, firebaseUid, compact = false, messageTimestamp, onLogged }: ChatLogCardProps) {
    const data = action.data || {};
    const [status, setStatus] = useState<'pending' | 'saving' | 'saved' | 'dismissed'>(() => {
        // Old format actions (already logged) have status/summary instead of data
        if (!action.data && (action as any).status) return 'saved';
        return 'pending';
    });

    // Glucose fields
    const [glucoseValue, setGlucoseValue] = useState(data.value || '');
    const [readingType, setReadingType] = useState(data.readingType || 'random');
    const [notes, setNotes] = useState('');
    const [medicationTaken, setMedicationTaken] = useState(false);
    const [selectedMedId, setSelectedMedId] = useState('');
    const [customMedName, setCustomMedName] = useState('');
    const [savedMeds, setSavedMeds] = useState<SavedMedication[]>([]);
    const [medsLoading, setMedsLoading] = useState(false);

    // Meal fields
    const [description, setDescription] = useState(data.description || '');
    const [mealType, setMealType] = useState(data.mealType || 'snack');
    const [carbsEstimate, setCarbsEstimate] = useState(data.carbsEstimate || '');

    const isGlucose = action.type === 'LOG_GLUCOSE';

    // Fetch user's saved medications when checkbox is checked
    useEffect(() => {
        if (!medicationTaken || savedMeds.length > 0 || medsLoading) return;
        setMedsLoading(true);
        api.getMedications(firebaseUid, true)
            .then((res) => setSavedMeds(res.medications || []))
            .catch(() => { })
            .finally(() => setMedsLoading(false));
    }, [medicationTaken, firebaseUid, savedMeds.length, medsLoading]);

    const selectedMed = savedMeds.find((m) => m._id === selectedMedId);

    if (status === 'dismissed') return null;

    if (status === 'saved') {
        return (
            <div className={`flex items-center gap-1.5 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-700 ${compact ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-[12px]'} font-medium`}>
                <FiCheck size={compact ? 12 : 14} />
                {isGlucose ? <FiDroplet size={compact ? 12 : 14} /> : null}
                <span>
                    {isGlucose
                        ? `Logged ${glucoseValue} mg/dL (${READING_TYPES.find(r => r.value === readingType)?.label || readingType})`
                        : `Logged ${description} (${MEAL_TYPES.find(m => m.value === mealType)?.label || mealType}, ~${carbsEstimate}g)`
                    }
                </span>
            </div>
        );
    }

    const handleConfirm = async () => {
        setStatus('saving');
        try {
            if (isGlucose) {
                const val = parseInt(glucoseValue, 10);
                if (!val || val < 20 || val > 600) { setStatus('pending'); return; }
                const medName = selectedMed ? selectedMed.medicationName : customMedName || undefined;
                const medType = selectedMed ? selectedMed.medicationType : undefined;
                const medDose = selectedMed ? selectedMed.dosage : undefined;
                const medDoseUnit = selectedMed ? selectedMed.doseUnit : undefined;
                const injSite = selectedMed?.isInjectable ? selectedMed.injectionSite : undefined;
                await api.createGlucoseReading({
                    firebaseUid,
                    value: val,
                    unit: 'mg/dL',
                    readingType,
                    notes: notes || 'Logged via DiaBuddy',
                    recordedAt: messageTimestamp ? new Date(messageTimestamp).toISOString() : undefined,
                    medicationTaken: medicationTaken || undefined,
                    medicationName: medicationTaken ? medName : undefined,
                    medicationType: medicationTaken ? medType : undefined,
                    medicationDose: medicationTaken ? medDose : undefined,
                    medicationDoseUnit: medicationTaken ? medDoseUnit : undefined,
                    injectionSite: medicationTaken ? injSite : undefined,
                });
            } else {
                const carbs = parseInt(carbsEstimate, 10);
                if (!description.trim() || !carbs) { setStatus('pending'); return; }
                await api.createMeal({
                    firebaseUid,
                    mealType,
                    carbsEstimate: carbs,
                    description: description.trim(),
                    timestamp: messageTimestamp ? new Date(messageTimestamp).toISOString() : undefined,
                });
            }
            setStatus('saved');
            // Notify the forecast gateway that new data was logged
            try {
                localStorage.setItem('bluely-data-logged', Date.now().toString());
                window.dispatchEvent(new Event('bluely:data-logged'));
            } catch { /* non-critical */ }
            onLogged?.(isGlucose ? 'glucose' : 'meal');
        } catch {
            setStatus('pending');
        }
    };

    const selectClass = `${compact ? 'text-[11px] px-1.5 py-0.5' : 'text-[12px] px-2 py-1'} rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#1F2F98]/20 focus:border-[#1F2F98]/30 font-medium text-gray-700`;
    const inputClass = `${compact ? 'text-[11px] px-1.5 py-0.5' : 'text-[12px] px-2 py-1'} rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#1F2F98]/20 focus:border-[#1F2F98]/30 font-medium text-gray-700`;

    return (
        <div className={`rounded-xl border border-[#1F2F98]/15 bg-[#1F2F98]/[0.03] ${compact ? 'p-2 mt-1' : 'p-2.5 mt-1.5'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-1.5">
                <div className={`flex items-center gap-1.5 ${compact ? 'text-[11px]' : 'text-[12px]'} font-semibold text-[#1F2F98]`}>
                    <FiEdit3 size={compact ? 11 : 13} />
                    <span>{isGlucose ? 'Log glucose reading?' : 'Log this meal?'}</span>
                </div>
                <button
                    onClick={() => setStatus('dismissed')}
                    className="p-0.5 rounded hover:bg-gray-200/60 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Dismiss"
                >
                    <FiX size={compact ? 12 : 14} />
                </button>
            </div>

            {isGlucose ? (
                <div className={`grid gap-1.5 ${compact ? 'grid-cols-2' : 'grid-cols-2'}`}>
                    {/* Value */}
                    <div>
                        <label className={`block ${compact ? 'text-[9px]' : 'text-[10px]'} text-gray-500 font-medium mb-0.5`}>Blood Glucose</label>
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                value={glucoseValue}
                                onChange={(e) => setGlucoseValue(e.target.value)}
                                min={20}
                                max={600}
                                className={`${inputClass} w-full`}
                                placeholder="mg/dL"
                            />
                        </div>
                    </div>
                    {/* Reading type */}
                    <div>
                        <label className={`block ${compact ? 'text-[9px]' : 'text-[10px]'} text-gray-500 font-medium mb-0.5`}>Reading Type</label>
                        <select value={readingType} onChange={(e) => setReadingType(e.target.value)} className={`${selectClass} w-full`}>
                            {READING_TYPES.map((rt) => (
                                <option key={rt.value} value={rt.value}>{rt.label}</option>
                            ))}
                        </select>
                    </div>
                    {/* Notes */}
                    <div className="col-span-2">
                        <label className={`block ${compact ? 'text-[9px]' : 'text-[10px]'} text-gray-500 font-medium mb-0.5`}>Notes (optional)</label>
                        <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className={`${inputClass} w-full`}
                            placeholder="Any notes..."
                            maxLength={200}
                        />
                    </div>
                    {/* Medication toggle */}
                    <div className="col-span-2">
                        <label className={`flex items-center gap-1.5 ${compact ? 'text-[10px]' : 'text-[11px]'} text-gray-600 cursor-pointer select-none`}>
                            <input
                                type="checkbox"
                                checked={medicationTaken}
                                onChange={(e) => setMedicationTaken(e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-[#1F2F98] focus:ring-[#1F2F98]/20"
                            />
                            Took medication
                        </label>
                        {medicationTaken && (
                            <div className="mt-1.5">
                                {medsLoading ? (
                                    <div className={`${compact ? 'text-[10px]' : 'text-[11px]'} text-gray-400 italic`}>Loading medications...</div>
                                ) : savedMeds.length > 0 ? (
                                    <div className="space-y-1">
                                        <div className="relative">
                                            <select
                                                value={selectedMedId}
                                                onChange={(e) => setSelectedMedId(e.target.value)}
                                                className={`${selectClass} w-full appearance-none pr-6`}
                                            >
                                                <option value="">Select medication...</option>
                                                {savedMeds.map((med) => (
                                                    <option key={med._id} value={med._id}>
                                                        {med.medicationName} ({med.dosage}{med.doseUnit})
                                                    </option>
                                                ))}
                                                <option value="__other__">Other...</option>
                                            </select>
                                            <FiChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={compact ? 10 : 12} />
                                        </div>
                                        {selectedMedId === '__other__' && (
                                            <input
                                                type="text"
                                                value={customMedName}
                                                onChange={(e) => setCustomMedName(e.target.value)}
                                                className={`${inputClass} w-full`}
                                                placeholder="Medication name"
                                                maxLength={100}
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        value={customMedName}
                                        onChange={(e) => setCustomMedName(e.target.value)}
                                        className={`${inputClass} w-full`}
                                        placeholder="Medication name"
                                        maxLength={100}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className={`grid gap-1.5 ${compact ? 'grid-cols-2' : 'grid-cols-2'}`}>
                    {/* Description */}
                    <div className="col-span-2">
                        <label className={`block ${compact ? 'text-[9px]' : 'text-[10px]'} text-gray-500 font-medium mb-0.5`}>Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className={`${inputClass} w-full`}
                            placeholder="What did you eat?"
                            maxLength={300}
                        />
                    </div>
                    {/* Meal type */}
                    <div>
                        <label className={`block ${compact ? 'text-[9px]' : 'text-[10px]'} text-gray-500 font-medium mb-0.5`}>Meal Type</label>
                        <select value={mealType} onChange={(e) => setMealType(e.target.value)} className={`${selectClass} w-full`}>
                            {MEAL_TYPES.map((mt) => (
                                <option key={mt.value} value={mt.value}>{mt.label}</option>
                            ))}
                        </select>
                    </div>
                    {/* Carbs */}
                    <div>
                        <label className={`block ${compact ? 'text-[9px]' : 'text-[10px]'} text-gray-500 font-medium mb-0.5`}>Carbs (g)</label>
                        <input
                            type="number"
                            value={carbsEstimate}
                            onChange={(e) => setCarbsEstimate(e.target.value)}
                            min={0}
                            max={500}
                            className={`${inputClass} w-full`}
                            placeholder="grams"
                        />
                    </div>
                </div>
            )}

            {/* Buttons */}
            <div className={`flex items-center gap-2 ${compact ? 'mt-1.5' : 'mt-2'}`}>
                <button
                    onClick={handleConfirm}
                    disabled={status === 'saving'}
                    className={`flex-1 flex items-center justify-center gap-1 ${compact ? 'py-1 text-[11px]' : 'py-1.5 text-[12px]'} rounded-lg bg-[#1F2F98] text-white font-semibold hover:bg-[#1a2880] active:scale-[0.98] transition-all disabled:opacity-50`}
                >
                    {status === 'saving' ? (
                        <span className="flex gap-0.5">
                            <span className="w-1 h-1 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1 h-1 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1 h-1 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                    ) : (
                        <>
                            <FiCheck size={compact ? 12 : 14} />
                            <span>Confirm & Log</span>
                        </>
                    )}
                </button>
                <button
                    onClick={() => setStatus('dismissed')}
                    disabled={status === 'saving'}
                    className={`${compact ? 'py-1 px-2.5 text-[11px]' : 'py-1.5 px-3 text-[12px]'} rounded-lg border border-gray-200 text-gray-500 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50`}
                >
                    Skip
                </button>
            </div>
        </div>
    );
}
