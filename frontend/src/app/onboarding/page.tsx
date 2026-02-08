'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, Select } from '@/components/ui';
import { FiArrowRight, FiArrowLeft, FiCheck, FiArrowUpRight } from 'react-icons/fi';
import Image from 'next/image';
import api from '@/lib/api';

const diabetesTypes = [
    { value: 'type1', label: 'Type 1 Diabetes' },
    { value: 'type2', label: 'Type 2 Diabetes' },
    { value: 'gestational', label: 'Gestational Diabetes' },
    { value: 'not_sure', label: 'Not sure' },
];

const ageRanges = [
    { value: '18-25', label: '18-25' },
    { value: '26-35', label: '26-35' },
    { value: '36-45', label: '36-45' },
    { value: '46-55', label: '46-55' },
    { value: '56-65', label: '56-65' },
    { value: '65+', label: '65+' },
];

const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const monitoringMethods = [
    { value: 'finger_prick', label: 'Finger-prick glucometer' },
    { value: 'cgm', label: 'Continuous Glucose Monitor (CGM)' },
];

const unitOptions = [
    { value: 'mg/dL', label: 'mg/dL (milligrams per deciliter)' },
    { value: 'mmol/L', label: 'mmol/L (millimoles per liter)' },
];

const readingsPerDayOptions = [
    { value: '1', label: '1 reading per day' },
    { value: '2', label: '2 readings per day' },
    { value: '3+', label: '3 or more readings per day' },
];

const activityLevelOptions = [
    { value: 'low', label: 'Low activity' },
    { value: 'moderate', label: 'Moderate activity' },
    { value: 'high', label: 'High activity' },
];

interface OnboardingData {
    // Step 2 - About You
    ageRange: string;
    gender: string;
    diabetesType: string;
    diagnosisYear: string;
    // Step 3 - Monitoring
    monitoringMethod: string;
    preferredUnit: string;
    readingsPerDay: string;
    // Step 4 - Lifestyle
    activityLevel: string;
    trackMood: boolean;
    trackSleep: boolean;
    // Step 5 - Targets
    targetGlucoseMin: string;
    targetGlucoseMax: string;
}

export default function OnboardingPage() {
    const { user, refreshUserProfile } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<OnboardingData>({
        ageRange: '',
        gender: '',
        diabetesType: '',
        diagnosisYear: '',
        monitoringMethod: 'finger_prick',
        preferredUnit: 'mg/dL',
        readingsPerDay: '3+',
        activityLevel: 'moderate',
        trackMood: false,
        trackSleep: false,
        targetGlucoseMin: '70',
        targetGlucoseMax: '180',
    });

    const totalSteps = 5;

    const updateFormData = (field: keyof OnboardingData, value: string | boolean) => {
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

    const handleSkip = () => {
        router.push('/dashboard');
    };

    const handleComplete = async () => {
        if (!user) return;

        try {
            setIsLoading(true);
            setError(null);

            await api.updateUser(user.uid, {
                ageRange: formData.ageRange,
                gender: formData.gender,
                diabetesType: formData.diabetesType,
                diagnosisYear: formData.diagnosisYear ? parseInt(formData.diagnosisYear) : undefined,
                monitoringMethod: formData.monitoringMethod,
                preferredUnit: formData.preferredUnit,
                readingsPerDay: formData.readingsPerDay,
                activityLevel: formData.activityLevel,
                trackMood: formData.trackMood,
                trackSleep: formData.trackSleep,
                targetGlucoseMin: parseInt(formData.targetGlucoseMin),
                targetGlucoseMax: parseInt(formData.targetGlucoseMax),
                onboardingCompleted: true,
            });

            await refreshUserProfile();
            router.push('/dashboard');
        } catch (err) {
            console.error('Onboarding error:', err);
            setError('Failed to save your profile. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Get context-aware text based on previous selections
    const getDiabetesTypeText = () => {
        switch (formData.diabetesType) {
            case 'type1':
                return "Thanks for sharing. Managing Type 1 diabetes often requires close attention to daily patterns. Bluely focuses on helping you understand how routine activities affect your glucose levels.";
            case 'type2':
                return "Got it. With Type 2 diabetes, lifestyle factors like meals and activity play a major role. Bluely helps you see how these daily choices affect your readings.";
            case 'gestational':
                return "Understood. Gestational diabetes requires careful monitoring. Bluely will help you track patterns and stay informed throughout your pregnancy.";
            case 'not_sure':
                return "That's okay. Bluely is designed to help you observe patterns regardless of diabetes type.";
            default:
                return "";
        }
    };

    const getReadingsText = () => {
        switch (formData.readingsPerDay) {
            case '1':
                return "Thanks. With one reading per day, Bluely can still track trends, but adding more readings improves insight accuracy.";
            case '2':
                return "Great. Two daily readings allow Bluely to compare changes across the day.";
            case '3+':
                return "Excellent. This gives Bluely enough data to identify meaningful patterns faster.";
            default:
                return "";
        }
    };

    const getActivityText = () => {
        switch (formData.activityLevel) {
            case 'low':
                return "Noted. Physical activity can significantly influence glucose levels. Bluely will help you observe these effects over time.";
            case 'moderate':
                return "Good to know. Bluely will track how your activity patterns impact your glucose readings.";
            case 'high':
                return "Nice! Bluely will track how your activity levels impact your glucose patterns.";
            default:
                return "";
        }
    };

    const userName = user?.displayName?.split(' ')[0] || 'there';

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Gradient Background (Smaller) */}
            <div
                className="hidden lg:flex lg:w-2/5 relative overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, #1F2F98 0%, #3B4CC0 50%, #1F2F98 100%)'
                }}
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }} />
                </div>

                {/* Decorative circles */}
                <div className="absolute top-20 right-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
                <div className="absolute bottom-32 left-5 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl" />

                {/* Content */}
                <div className="relative z-10 flex flex-col w-full p-8">
                    {/* Top Navigation */}
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <Link href="/" className="flex items-center space-x-3">
                            <Image
                                src="/icons/full_logotext_white.png"
                                alt="Bluely"
                                width={140}
                                height={40}
                                className="h-10 w-auto"
                            />
                        </Link>

                        {/* Skip */}
                        <button
                            onClick={handleSkip}
                            className="flex items-center space-x-1 text-white/70 hover:text-white transition-colors text-sm"
                        >
                            <span>Skip</span>
                            <FiArrowUpRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Step Indicators */}
                    <div className="flex items-center justify-center space-x-3 mt-12">
                        {[1, 2, 3, 4, 5].map((num) => (
                            <div
                                key={num}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${step === num
                                    ? 'bg-white text-[#1F2F98]'
                                    : step > num
                                        ? 'bg-white/30 text-white'
                                        : 'bg-white/10 text-white/50'
                                    }`}
                            >
                                {step > num ? <FiCheck className="w-4 h-4" /> : num}
                            </div>
                        ))}
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Bottom Content */}
                    <div className="space-y-4">
                        <p className="text-white/80 text-sm">
                            Bluely helps you understand how your daily habits affect your blood glucose — beyond just numbers.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Form Content */}
            <div className="w-full lg:w-3/5 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-white overflow-y-auto">
                <div className="w-full max-w-lg">
                    {/* Mobile Logo & Skip */}
                    <div className="lg:hidden flex items-center justify-between mb-8">
                        <Link href="/" className="flex items-center">
                            <Image
                                src="/icons/full_logotext.png"
                                alt="Bluely"
                                width={120}
                                height={35}
                                className="h-9 w-auto"
                            />
                        </Link>
                        <button
                            onClick={handleSkip}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Skip
                        </button>
                    </div>

                    {/* Mobile Step Indicators */}
                    <div className="lg:hidden flex items-center justify-center space-x-2 mb-8">
                        {[1, 2, 3, 4, 5].map((num) => (
                            <div
                                key={num}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${step === num
                                    ? 'bg-[#1F2F98] text-white'
                                    : step > num
                                        ? 'bg-[#1F2F98]/20 text-[#1F2F98]'
                                        : 'bg-gray-100 text-gray-400'
                                    }`}
                            >
                                {step > num ? <FiCheck className="w-3 h-3" /> : num}
                            </div>
                        ))}
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Step 1 - Welcome */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                    Hello {userName},
                                </h1>
                                <p className="mt-3 text-gray-600 text-lg">
                                    We&apos;ll ask you a few questions to personalize your experience! It&apos;ll be quick.
                                </p>
                            </div>

                            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                                <p className="text-[#1F2F98] font-medium">
                                    Bluely helps you understand how your daily habits affect your blood glucose — beyond just numbers.
                                </p>
                            </div>

                            <Button
                                onClick={handleNext}
                                className="w-full bg-[#1F2F98] hover:bg-[#1F2F98]/90"
                                size="lg"
                            >
                                Let&apos;s get started
                                <FiArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    )}

                    {/* Step 2 - About You */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Tell us a bit about you
                                </h2>
                                <p className="mt-2 text-gray-600">
                                    This helps us personalize insights and recommendations based on your profile.
                                </p>
                            </div>

                            <div className="space-y-5">
                                <Select
                                    label="Age range"
                                    options={ageRanges}
                                    value={formData.ageRange}
                                    onChange={(e) => updateFormData('ageRange', e.target.value)}
                                    placeholder="Select your age range"
                                />

                                <Select
                                    label="Gender (optional)"
                                    options={genderOptions}
                                    value={formData.gender}
                                    onChange={(e) => updateFormData('gender', e.target.value)}
                                    placeholder="Select your gender"
                                />

                                <Select
                                    label="Type of diabetes"
                                    options={diabetesTypes}
                                    value={formData.diabetesType}
                                    onChange={(e) => updateFormData('diabetesType', e.target.value)}
                                    placeholder="Select your diabetes type"
                                />

                                <Input
                                    label="Year of diagnosis (optional)"
                                    type="number"
                                    min="1900"
                                    max={new Date().getFullYear()}
                                    value={formData.diagnosisYear}
                                    onChange={(e) => updateFormData('diagnosisYear', e.target.value)}
                                    placeholder="e.g., 2020"
                                />
                            </div>

                            <div className="flex justify-between pt-4">
                                <Button variant="ghost" onClick={handleBack}>
                                    <FiArrowLeft className="w-4 h-4 mr-2" />
                                    Back
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    className="bg-[#1F2F98] hover:bg-[#1F2F98]/90"
                                >
                                    Continue
                                    <FiArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3 - Monitoring */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Your glucose monitoring routine
                                </h2>
                                <p className="mt-2 text-gray-600">
                                    Bluely works with simple tools. Tell us how you usually check your blood glucose.
                                </p>
                            </div>

                            {/* Context-aware text */}
                            {formData.diabetesType && (
                                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                    <p className="text-sm text-[#1F2F98]">
                                        {getDiabetesTypeText()}
                                    </p>
                                </div>
                            )}

                            <div className="space-y-5">
                                <Select
                                    label="Glucose measurement method"
                                    options={monitoringMethods}
                                    value={formData.monitoringMethod}
                                    onChange={(e) => updateFormData('monitoringMethod', e.target.value)}
                                />

                                <Select
                                    label="Preferred unit"
                                    options={unitOptions}
                                    value={formData.preferredUnit}
                                    onChange={(e) => updateFormData('preferredUnit', e.target.value)}
                                    helperText="Most countries use mg/dL. UK and some European countries use mmol/L."
                                />

                                <Select
                                    label="Typical readings per day"
                                    options={readingsPerDayOptions}
                                    value={formData.readingsPerDay}
                                    onChange={(e) => updateFormData('readingsPerDay', e.target.value)}
                                />
                            </div>

                            <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                                <p className="text-sm text-amber-800">
                                    <strong>Tip:</strong> We recommend at least 3 readings per day (before meals or 2 hours after meals) for meaningful insights.
                                </p>
                            </div>

                            <div className="flex justify-between pt-4">
                                <Button variant="ghost" onClick={handleBack}>
                                    <FiArrowLeft className="w-4 h-4 mr-2" />
                                    Back
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    className="bg-[#1F2F98] hover:bg-[#1F2F98]/90"
                                >
                                    Continue
                                    <FiArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 4 - Lifestyle */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Your daily habits matter
                                </h2>
                                <p className="mt-2 text-gray-600">
                                    Blood glucose is influenced by more than food. Bluely helps you track key daily factors.
                                </p>
                            </div>

                            {/* Context-aware text */}
                            {formData.readingsPerDay && (
                                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                    <p className="text-sm text-[#1F2F98]">
                                        {getReadingsText()}
                                    </p>
                                </div>
                            )}

                            <div className="space-y-5">
                                <Select
                                    label="Physical activity level"
                                    options={activityLevelOptions}
                                    value={formData.activityLevel}
                                    onChange={(e) => updateFormData('activityLevel', e.target.value)}
                                />

                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Optional tracking factors
                                    </label>

                                    <div className="flex items-center">
                                        <input
                                            id="trackMood"
                                            type="checkbox"
                                            checked={formData.trackMood}
                                            onChange={(e) => updateFormData('trackMood', e.target.checked)}
                                            className="h-4 w-4 text-[#1F2F98] focus:ring-[#1F2F98] border-gray-300 rounded"
                                        />
                                        <label htmlFor="trackMood" className="ml-3 text-sm text-gray-700">
                                            Track mood & stress levels
                                        </label>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            id="trackSleep"
                                            type="checkbox"
                                            checked={formData.trackSleep}
                                            onChange={(e) => updateFormData('trackSleep', e.target.checked)}
                                            className="h-4 w-4 text-[#1F2F98] focus:ring-[#1F2F98] border-gray-300 rounded"
                                        />
                                        <label htmlFor="trackSleep" className="ml-3 text-sm text-gray-700">
                                            Track sleep quality
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {(formData.trackMood || formData.trackSleep) && (
                                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                                    <p className="text-sm text-green-800">
                                        {formData.trackMood && "Stress and mood can affect glucose more than expected. "}
                                        {formData.trackSleep && "Sleep quality also impacts blood sugar levels. "}
                                        Bluely will factor this into your insights.
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-between pt-4">
                                <Button variant="ghost" onClick={handleBack}>
                                    <FiArrowLeft className="w-4 h-4 mr-2" />
                                    Back
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    className="bg-[#1F2F98] hover:bg-[#1F2F98]/90"
                                >
                                    Continue
                                    <FiArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 5 - Ready / Summary */}
                    {step === 5 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    You&apos;re all set 🎉
                                </h2>
                                <p className="mt-2 text-gray-600">
                                    Log your readings consistently and Bluely will start showing patterns after about 21 readings.
                                </p>
                            </div>

                            {/* Context-aware text */}
                            {formData.activityLevel && (
                                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                    <p className="text-sm text-[#1F2F98]">
                                        {getActivityText()}
                                    </p>
                                </div>
                            )}

                            {/* Target Range */}
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Set your target glucose range
                                </label>
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
                            </div>

                            {/* Personalized Summary */}
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <h3 className="font-semibold text-gray-900 mb-3">Based on what you shared:</h3>
                                <ul className="space-y-2 text-sm text-gray-700">
                                    {formData.readingsPerDay && (
                                        <li className="flex items-start">
                                            <span className="text-[#1F2F98] mr-2">•</span>
                                            You check your glucose {formData.readingsPerDay === '3+' ? '3+' : formData.readingsPerDay} time{formData.readingsPerDay !== '1' ? 's' : ''} per day
                                        </li>
                                    )}
                                    {formData.activityLevel && (
                                        <li className="flex items-start">
                                            <span className="text-[#1F2F98] mr-2">•</span>
                                            Your activity level is {formData.activityLevel}
                                        </li>
                                    )}
                                    {(formData.trackMood || formData.trackSleep) && (
                                        <li className="flex items-start">
                                            <span className="text-[#1F2F98] mr-2">•</span>
                                            You want to track {formData.trackMood && 'mood/stress'}{formData.trackMood && formData.trackSleep && ' and '}{formData.trackSleep && 'sleep quality'}
                                        </li>
                                    )}
                                </ul>
                                <p className="mt-4 text-sm text-gray-600">
                                    Log consistently and Bluely will generate insights after about <strong>21 readings</strong>.
                                </p>
                            </div>

                            <div className="flex justify-between pt-4">
                                <Button variant="ghost" onClick={handleBack}>
                                    <FiArrowLeft className="w-4 h-4 mr-2" />
                                    Back
                                </Button>
                                <Button
                                    onClick={handleComplete}
                                    isLoading={isLoading}
                                    className="bg-[#1F2F98] hover:bg-[#1F2F98]/90"
                                    size="lg"
                                >
                                    <FiCheck className="w-4 h-4 mr-2" />
                                    Start my journey
                                </Button>
                            </div>

                            <p className="text-center text-xs text-gray-500">
                                You can update your information anytime in settings.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
