'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, LoadingSpinner } from '@/components/ui';
import { FiSave, FiUser, FiSettings, FiTarget } from 'react-icons/fi';
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

interface ProfileFormData {
    displayName: string;
    diabetesType: string;
    diagnosisYear: string;
    preferredUnit: string;
    targetGlucoseMin: string;
    targetGlucoseMax: string;
}

export default function SettingsPage() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm<ProfileFormData>();

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;

            try {
                const data = await api.getUser(user.uid);
                reset({
                    displayName: data.displayName || user.displayName || '',
                    diabetesType: data.diabetesType || '',
                    diagnosisYear: data.diagnosisYear?.toString() || '',
                    preferredUnit: data.preferredUnit || 'mg/dL',
                    targetGlucoseMin: data.targetGlucoseMin?.toString() || '70',
                    targetGlucoseMax: data.targetGlucoseMax?.toString() || '180',
                });
            } catch (err) {
                console.error('Error fetching profile:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [user, reset]);

    const onSubmit = async (data: ProfileFormData) => {
        if (!user) return;

        try {
            setIsSaving(true);
            setError(null);

            await api.updateUser(user.uid, {
                displayName: data.displayName,
                diabetesType: data.diabetesType || undefined,
                diagnosisYear: data.diagnosisYear ? parseInt(data.diagnosisYear) : undefined,
                preferredUnit: data.preferredUnit,
                targetGlucoseMin: parseInt(data.targetGlucoseMin),
                targetGlucoseMax: parseInt(data.targetGlucoseMax),
            });

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Error saving settings:', err);
            setError('Failed to save settings. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-1">
                    Manage your profile and preferences
                </p>
            </div>

            {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                    Settings saved successfully!
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Profile Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <FiUser className="w-5 h-5 mr-2 text-blue-600" />
                            Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            label="Display Name"
                            error={errors.displayName?.message}
                            {...register('displayName', { required: 'Name is required' })}
                        />
                        <Input
                            label="Email"
                            type="email"
                            value={user?.email || ''}
                            disabled
                            helperText="Email cannot be changed"
                        />
                    </CardContent>
                </Card>

                {/* Diabetes Info Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <FiSettings className="w-5 h-5 mr-2 text-blue-600" />
                            Diabetes Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Select
                            label="Diabetes Type"
                            options={diabetesTypes}
                            placeholder="Select your diabetes type"
                            {...register('diabetesType')}
                        />
                        <Input
                            label="Year of Diagnosis"
                            type="number"
                            min="1900"
                            max={new Date().getFullYear()}
                            placeholder="e.g., 2020"
                            {...register('diagnosisYear')}
                        />
                    </CardContent>
                </Card>

                {/* Preferences Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <FiTarget className="w-5 h-5 mr-2 text-blue-600" />
                            Preferences & Targets
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Select
                            label="Preferred Glucose Unit"
                            options={unitOptions}
                            {...register('preferredUnit')}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Target Minimum"
                                type="number"
                                error={errors.targetGlucoseMin?.message}
                                {...register('targetGlucoseMin', {
                                    required: 'Required',
                                    min: { value: 40, message: 'Min 40' },
                                    max: { value: 200, message: 'Max 200' },
                                })}
                            />
                            <Input
                                label="Target Maximum"
                                type="number"
                                error={errors.targetGlucoseMax?.message}
                                {...register('targetGlucoseMax', {
                                    required: 'Required',
                                    min: { value: 100, message: 'Min 100' },
                                    max: { value: 400, message: 'Max 400' },
                                })}
                            />
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                                <strong>Note:</strong> Your target range is used to determine if readings are
                                low, in range, or high. Consult with your healthcare provider for personalized targets.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="flex justify-end">
                    <Button type="submit" isLoading={isSaving} disabled={!isDirty}>
                        <FiSave className="w-4 h-4 mr-2" />
                        Save Changes
                    </Button>
                </div>
            </form>

            {/* Account Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-red-600">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <Button variant="danger" size="sm" disabled>
                        Delete Account (Coming Soon)
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
