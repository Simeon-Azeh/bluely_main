'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Card, CardContent, Button, Input, Select, LoadingSpinner } from '@/components/ui';
import {
    FiUser,
    FiMail,
    FiCalendar,
    FiActivity,
    FiTarget,
    FiSave,
    FiBell,
    FiShield,
    FiSmartphone,
    FiGlobe,
    FiMoon,
    FiLogOut,
    FiTrash2,
    FiCheck,
    FiChevronRight,
    FiAlertTriangle,
    FiEdit3,
    FiHeart,
    FiDroplet,
    FiDownload,
    FiBarChart2,
} from 'react-icons/fi';
import api from '@/lib/api';

const diabetesTypes = [
    { value: 'type1', label: 'Type 1 Diabetes' },
    { value: 'type2', label: 'Type 2 Diabetes' },
    { value: 'gestational', label: 'Gestational Diabetes' },
    { value: 'prediabetes', label: 'Prediabetes' },
    { value: 'other', label: 'Other / Not Sure' },
];

const unitOptions = [
    { value: 'mg/dL', label: 'mg/dL' },
    { value: 'mmol/L', label: 'mmol/L' },
];

const activityLevels = [
    { value: 'sedentary', label: 'Sedentary (little or no exercise)' },
    { value: 'light', label: 'Light (1-3 days/week)' },
    { value: 'moderate', label: 'Moderate (3-5 days/week)' },
    { value: 'active', label: 'Active (6-7 days/week)' },
    { value: 'very_active', label: 'Very Active (intense exercise daily)' },
];

interface ProfileFormData {
    displayName: string;
    diabetesType: string;
    diagnosisYear: string;
    preferredUnit: string;
    targetGlucoseMin: string;
    targetGlucoseMax: string;
    activityLevel: string;
    reminderEnabled: boolean;
    darkMode: boolean;
}

export default function SettingsPage() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState('profile');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isDirty },
    } = useForm<ProfileFormData>();

    const watchedUnit = watch('preferredUnit');
    const watchedMin = watch('targetGlucoseMin');
    const watchedMax = watch('targetGlucoseMax');

    const menuItems = [
        { id: 'profile', label: 'Profile', icon: FiUser },
        { id: 'health', label: 'Health Info', icon: FiHeart },
        { id: 'targets', label: 'Glucose Targets', icon: FiTarget },
        { id: 'preferences', label: 'Preferences', icon: FiGlobe },
        { id: 'notifications', label: 'Notifications', icon: FiBell },
        { id: 'account', label: 'Account', icon: FiShield },
    ];

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
                    activityLevel: data.activityLevel || 'moderate',
                    reminderEnabled: data.reminderEnabled ?? true,
                    darkMode: false,
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
                activityLevel: data.activityLevel,
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

    const handleSignOut = async () => {
        try {
            await signOut();
            router.push('/login');
        } catch (err) {
            console.error('Error signing out:', err);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-500">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-8 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500 mt-1">Manage your account and preferences</p>
            </div>

            {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <FiCheck className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-green-700 font-medium">Settings saved successfully!</span>
                </div>
            )}

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <FiAlertTriangle className="w-4 h-4 text-red-600" />
                    </div>
                    <span className="text-red-700 font-medium">{error}</span>
                </div>
            )}

            <div className="grid lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                    <Card className="border-0 shadow-lg shadow-gray-100 sticky top-24">
                        <CardContent className="p-2">
                            <nav className="space-y-1">
                                {menuItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = activeSection === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveSection(item.id)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${isActive ? 'bg-[#1F2F98] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                                            <span className="font-medium">{item.label}</span>
                                            {isActive && <FiChevronRight className="w-4 h-4 ml-auto" />}
                                        </button>
                                    );
                                })}
                            </nav>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-3 space-y-6">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        {activeSection === 'profile' && (
                            <Card className="border-0 shadow-lg shadow-gray-100">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 bg-[#1F2F98]/10 rounded-xl flex items-center justify-center">
                                            <FiUser className="w-6 h-6 text-[#1F2F98]" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
                                            <p className="text-gray-500 text-sm">Update your personal details</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 mb-8 p-4 bg-gray-50 rounded-xl">
                                        <div className="w-20 h-20 bg-gradient-to-br from-[#1F2F98] to-[#3B4CC0] rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                            {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">{user?.displayName || 'User'}</h3>
                                            <p className="text-sm text-gray-500">{user?.email}</p>
                                            <p className="text-xs text-gray-400 mt-1">Member since {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2"><FiUser className="w-4 h-4 inline mr-2" />Display Name</label>
                                            <Input placeholder="Enter your name" error={errors.displayName?.message} {...register('displayName', { required: 'Name is required' })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2"><FiMail className="w-4 h-4 inline mr-2" />Email Address</label>
                                            <Input type="email" value={user?.email || ''} disabled className="bg-gray-50" />
                                            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeSection === 'health' && (
                            <Card className="border-0 shadow-lg shadow-gray-100">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                                            <FiHeart className="w-6 h-6 text-pink-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Health Information</h2>
                                            <p className="text-gray-500 text-sm">Your diabetes and health details</p>
                                        </div>
                                    </div>
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2"><FiDroplet className="w-4 h-4 inline mr-2" />Diabetes Type</label>
                                            <Select options={diabetesTypes} placeholder="Select your diabetes type" {...register('diabetesType')} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2"><FiCalendar className="w-4 h-4 inline mr-2" />Year of Diagnosis</label>
                                            <Input type="number" min="1900" max={new Date().getFullYear()} placeholder="e.g., 2020" {...register('diagnosisYear')} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2"><FiActivity className="w-4 h-4 inline mr-2" />Activity Level</label>
                                            <Select options={activityLevels} placeholder="Select your activity level" {...register('activityLevel')} />
                                        </div>
                                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                            <p className="text-sm text-blue-800"><strong>Why we ask:</strong> Your health information helps Bluely provide more personalized insights and recommendations.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeSection === 'targets' && (
                            <Card className="border-0 shadow-lg shadow-gray-100">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                            <FiTarget className="w-6 h-6 text-green-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Glucose Targets</h2>
                                            <p className="text-gray-500 text-sm">Set your target glucose range</p>
                                        </div>
                                    </div>
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Unit</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {unitOptions.map((option) => (
                                                    <label key={option.value} className={`flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${watchedUnit === option.value ? 'border-[#1F2F98] bg-[#1F2F98]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                                                        <input type="radio" value={option.value} className="sr-only" {...register('preferredUnit')} />
                                                        <span className={`font-medium ${watchedUnit === option.value ? 'text-[#1F2F98]' : 'text-gray-700'}`}>{option.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Target Minimum</label>
                                                <Input type="number" error={errors.targetGlucoseMin?.message} {...register('targetGlucoseMin', { required: 'Required', min: { value: 40, message: 'Min 40' }, max: { value: 200, message: 'Max 200' } })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Target Maximum</label>
                                                <Input type="number" error={errors.targetGlucoseMax?.message} {...register('targetGlucoseMax', { required: 'Required', min: { value: 100, message: 'Min 100' }, max: { value: 400, message: 'Max 400' } })} />
                                            </div>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-xl">
                                            <p className="text-sm font-medium text-gray-700 mb-3">Your Target Range</p>
                                            <div className="relative h-8 bg-gradient-to-r from-red-200 via-green-200 to-orange-200 rounded-full overflow-hidden">
                                                <div className="absolute top-0 bottom-0 bg-green-500/30 border-l-2 border-r-2 border-green-600" style={{ left: `${Math.max(0, ((parseInt(watchedMin || '70') - 40) / 360) * 100)}%`, right: `${Math.max(0, 100 - ((parseInt(watchedMax || '180') - 40) / 360) * 100)}%` }} />
                                            </div>
                                            <div className="flex justify-between mt-2 text-xs text-gray-500">
                                                <span>40</span>
                                                <span className="text-green-600 font-medium">{watchedMin || 70} - {watchedMax || 180} {watchedUnit || 'mg/dL'}</span>
                                                <span>400</span>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                                            <p className="text-sm text-amber-800"><strong>Important:</strong> Consult with your healthcare provider to determine the best target range for your situation.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeSection === 'preferences' && (
                            <Card className="border-0 shadow-lg shadow-gray-100">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                            <FiGlobe className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Preferences</h2>
                                            <p className="text-gray-500 text-sm">Customize your app experience</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center"><FiMoon className="w-5 h-5 text-gray-600" /></div>
                                                <div><p className="font-medium text-gray-900">Dark Mode</p><p className="text-sm text-gray-500">Reduce eye strain at night</p></div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" {...register('darkMode')} />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#1F2F98]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1F2F98]"></div>
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><FiSmartphone className="w-5 h-5 text-blue-600" /></div>
                                                <div><p className="font-medium text-gray-900">Install App</p><p className="text-sm text-gray-500">Add Bluely to your home screen</p></div>
                                            </div>
                                            <Button type="button" variant="outline" size="sm">Install</Button>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl opacity-60">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center"><FiGlobe className="w-5 h-5 text-indigo-600" /></div>
                                                <div><p className="font-medium text-gray-900">Language</p><p className="text-sm text-gray-500">English (Coming Soon)</p></div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeSection === 'notifications' && (
                            <Card className="border-0 shadow-lg shadow-gray-100">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                            <FiBell className="w-6 h-6 text-orange-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                                            <p className="text-gray-500 text-sm">Manage your notification preferences</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><FiActivity className="w-5 h-5 text-green-600" /></div>
                                                <div><p className="font-medium text-gray-900">Reading Reminders</p><p className="text-sm text-gray-500">Get reminded to log your glucose</p></div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" {...register('reminderEnabled')} />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#1F2F98]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1F2F98]"></div>
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl opacity-60">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><FiBarChart2 className="w-5 h-5 text-blue-600" /></div>
                                                <div><p className="font-medium text-gray-900">Weekly Summary</p><p className="text-sm text-gray-500">Receive weekly insights (Coming Soon)</p></div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-not-allowed">
                                                <input type="checkbox" className="sr-only peer" disabled />
                                                <div className="w-11 h-6 bg-gray-200 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5"></div>
                                            </label>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeSection === 'account' && (
                            <div className="space-y-6">
                                <Card className="border-0 shadow-lg shadow-gray-100">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                                                <FiShield className="w-6 h-6 text-gray-600" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900">Account</h2>
                                                <p className="text-gray-500 text-sm">Manage your account settings</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <button type="button" onClick={handleSignOut} className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center"><FiLogOut className="w-5 h-5 text-gray-600" /></div>
                                                    <div className="text-left"><p className="font-medium text-gray-900">Sign Out</p><p className="text-sm text-gray-500">Sign out of your account</p></div>
                                                </div>
                                                <FiChevronRight className="w-5 h-5 text-gray-400" />
                                            </button>
                                            <button type="button" className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors opacity-60 cursor-not-allowed" disabled>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><FiDownload className="w-5 h-5 text-blue-600" /></div>
                                                    <div className="text-left"><p className="font-medium text-gray-900">Export Data</p><p className="text-sm text-gray-500">Download your data (Coming Soon)</p></div>
                                                </div>
                                                <FiChevronRight className="w-5 h-5 text-gray-400" />
                                            </button>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-2 border-red-200 bg-red-50/50">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                                <FiAlertTriangle className="w-6 h-6 text-red-600" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-red-800">Danger Zone</h2>
                                                <p className="text-red-600 text-sm">Irreversible actions</p>
                                            </div>
                                        </div>
                                        {!showDeleteConfirm ? (
                                            <button type="button" onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-3 p-4 w-full text-left bg-white rounded-xl border border-red-200 hover:border-red-300 transition-colors">
                                                <FiTrash2 className="w-5 h-5 text-red-600" />
                                                <div><p className="font-medium text-red-800">Delete Account</p><p className="text-sm text-red-600">Permanently delete your account and all data</p></div>
                                            </button>
                                        ) : (
                                            <div className="p-4 bg-white rounded-xl border border-red-200">
                                                <p className="text-red-800 font-medium mb-4">Are you sure? This action cannot be undone.</p>
                                                <div className="flex gap-3">
                                                    <Button type="button" variant="danger" size="sm" disabled><FiTrash2 className="w-4 h-4 mr-2" />Delete (Coming Soon)</Button>
                                                    <Button type="button" variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {['profile', 'health', 'targets', 'preferences', 'notifications'].includes(activeSection) && (
                            <div className="flex justify-end mt-6">
                                <Button type="submit" isLoading={isSaving} disabled={!isDirty}>
                                    <FiSave className="w-4 h-4 mr-2" />
                                    Save Changes
                                </Button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
