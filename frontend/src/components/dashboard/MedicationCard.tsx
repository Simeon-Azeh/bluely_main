'use client';

import React, { useState } from 'react';
import { Card, CardContent, Button } from '@/components/ui';
import { FiX, FiSend, FiCheck } from 'react-icons/fi';
import { TbPill, TbVaccine, TbFirstAidKit, TbCalendarEvent, TbRefresh } from 'react-icons/tb';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

interface MedicationCardProps {
    onComplete?: () => void;
    onDismiss?: () => void;
}

export default function MedicationCard({ onComplete, onDismiss }: MedicationCardProps) {
    const { user } = useAuth();
    const [medicationCategory, setMedicationCategory] = useState('');
    const [medicationFrequency, setMedicationFrequency] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleDismiss = async () => {
        if (!user) return;
        try {
            await api.dismissHealthPrompt(user.uid);
        } catch (e) {
            console.error('Failed to dismiss:', e);
        }
        onDismiss?.();
    };

    const handleSubmit = async () => {
        if (!user || !medicationCategory || !medicationFrequency) return;

        setIsSubmitting(true);
        try {
            await api.upsertHealthProfile(user.uid, {
                medicationCategory,
                medicationFrequency,
            });
            setSubmitted(true);
            setTimeout(() => onComplete?.(), 1500);
        } catch (error) {
            console.error('Error saving medication info:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)] bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent>
                    <div className="text-center py-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FiCheck className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="font-semibold text-green-700">Medication info saved!</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const isValid = medicationCategory && medicationFrequency;

    return (
        <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)] bg-gradient-to-br from-purple-50 to-pink-50 relative overflow-hidden">
            <CardContent>
                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <FiX className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <TbPill className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Medication Details</h3>
                        <p className="text-xs text-gray-500">Helps us give better recommendations</p>
                    </div>
                </div>

                {/* Medication Category + Frequency — side by side */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                    {/* Medication Category */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Type</label>
                        <div className="space-y-2">
                            {[
                                { value: 'insulin', label: 'Insulin', icon: TbVaccine },
                                { value: 'oral', label: 'Oral', icon: TbPill },
                                { value: 'other', label: 'Other', icon: TbFirstAidKit },
                            ].map((opt) => {
                                const Icon = opt.icon;
                                return (
                                    <button
                                        key={opt.value}
                                        onClick={() => setMedicationCategory(opt.value)}
                                        className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border-2 text-left transition-all ${medicationCategory === opt.value
                                            ? 'border-purple-500 bg-purple-50 shadow-[0_4px_20px_rgba(0,0,0,0.06)]'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${medicationCategory === opt.value ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-800">{opt.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Frequency */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Frequency</label>
                        <div className="space-y-2">
                            {[
                                { value: 'daily', label: 'Daily', icon: TbCalendarEvent },
                                { value: 'occasionally', label: 'Occasionally', icon: TbRefresh },
                            ].map((opt) => {
                                const Icon = opt.icon;
                                return (
                                    <button
                                        key={opt.value}
                                        onClick={() => setMedicationFrequency(opt.value)}
                                        className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border-2 text-left transition-all ${medicationFrequency === opt.value
                                            ? 'border-purple-500 bg-purple-50 shadow-[0_4px_20px_rgba(0,0,0,0.06)]'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${medicationFrequency === opt.value ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-800">{opt.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <Button
                    onClick={handleSubmit}
                    disabled={!isValid}
                    isLoading={isSubmitting}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                >
                    <FiSend className="w-4 h-4 mr-2" />
                    Save Medication Info
                </Button>
            </CardContent>
        </Card>
    );
}
