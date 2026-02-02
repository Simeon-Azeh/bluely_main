'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, Select, Card } from '@/components/ui';
import { FiDroplet, FiArrowRight, FiArrowLeft, FiCheck } from 'react-icons/fi';
import api from '@/lib/api';

const diabetesTypes = [
    { value: 'type1', label: 'Type 1 Diabetes' },
    { value: 'type2', label: 'Type 2 Diabetes' },
    { value: 'gestational', label: 'Gestational Diabetes' },
    { value: 'prediabetes', label: 'Prediabetes' },
    { value: 'other', label: 'Other / Not Sure' },
];

const unitOptions = [
    { value: 'mg/dL', label: 'mg/dL (milligrams per deciliter)' },
    { value: 'mmol/L', label: 'mmol/L (millimoles per liter)' },
];

interface OnboardingData {
    diabetesType: string;
    diagnosisYear: string;
    preferredUnit: string;
    targetGlucoseMin: string;
    targetGlucoseMax: string;
}

export default function OnboardingPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<OnboardingData>({
        diabetesType: '',
        diagnosisYear: '',
        preferredUnit: 'mg/dL',
        targetGlucoseMin: '70',
        targetGlucoseMax: '180',
    });

    const totalSteps = 3;

    const updateFormData = (field: keyof OnboardingData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNext = () => {
        if (step < totalSteps) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleComplete = async () => {
        if (!user) return;

        try {
            setIsLoading(true);
            setError(null);

            await api.updateUser(user.uid, {
                diabetesType: formData.diabetesType,
                diagnosisYear: formData.diagnosisYear ? parseInt(formData.diagnosisYear) : undefined,
                preferredUnit: formData.preferredUnit,
                targetGlucoseMin: parseInt(formData.targetGlucoseMin),
                targetGlucoseMax: parseInt(formData.targetGlucoseMax),
                onboardingCompleted: true,
            });

            router.push('/dashboard');
        } catch (err) {
            console.error('Onboarding error:', err);
            setError('Failed to save your profile. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-lg mx-auto">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto">
                        <FiDroplet className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="mt-4 text-2xl font-bold text-gray-900">
                        Let&apos;s personalize your experience
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Help us understand your needs better
                    </p>
                </div>

                {/* Progress bar */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Step {step} of {totalSteps}</span>
                        <span className="text-sm text-gray-600">{Math.round((step / totalSteps) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(step / totalSteps) * 100}%` }}
                        />
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <Card className="mb-6">
                    {step === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-gray-900">
                                About your diabetes
                            </h2>
                            <Select
                                label="What type of diabetes do you have?"
                                options={diabetesTypes}
                                value={formData.diabetesType}
                                onChange={(e) => updateFormData('diabetesType', e.target.value)}
                                placeholder="Select your diabetes type"
                            />
                            <Input
                                label="What year were you diagnosed? (optional)"
                                type="number"
                                min="1900"
                                max={new Date().getFullYear()}
                                value={formData.diagnosisYear}
                                onChange={(e) => updateFormData('diagnosisYear', e.target.value)}
                                placeholder="e.g., 2020"
                            />
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Measurement preferences
                            </h2>
                            <Select
                                label="Preferred glucose unit"
                                options={unitOptions}
                                value={formData.preferredUnit}
                                onChange={(e) => updateFormData('preferredUnit', e.target.value)}
                                helperText="Most countries use mg/dL. UK and some European countries use mmol/L."
                            />
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Target glucose range
                            </h2>
                            <p className="text-sm text-gray-600">
                                Set your target blood glucose range. We&apos;ll use this to show when your readings are in range.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Minimum target"
                                    type="number"
                                    value={formData.targetGlucoseMin}
                                    onChange={(e) => updateFormData('targetGlucoseMin', e.target.value)}
                                    helperText={formData.preferredUnit}
                                />
                                <Input
                                    label="Maximum target"
                                    type="number"
                                    value={formData.targetGlucoseMax}
                                    onChange={(e) => updateFormData('targetGlucoseMax', e.target.value)}
                                    helperText={formData.preferredUnit}
                                />
                            </div>
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <strong>Tip:</strong> Standard targets are 70-180 mg/dL or 4-10 mmol/L,
                                    but your healthcare provider may recommend different values.
                                </p>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Navigation buttons */}
                <div className="flex justify-between">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={step === 1}
                        className={step === 1 ? 'invisible' : ''}
                    >
                        <FiArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>

                    {step < totalSteps ? (
                        <Button onClick={handleNext}>
                            Next
                            <FiArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button onClick={handleComplete} isLoading={isLoading}>
                            <FiCheck className="w-4 h-4 mr-2" />
                            Complete Setup
                        </Button>
                    )}
                </div>

                {/* Skip option */}
                <div className="text-center mt-6">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        Skip for now
                    </button>
                </div>
            </div>
        </div>
    );
}
