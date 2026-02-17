'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
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
    FiHeart,
    FiDroplet,
    FiDownload,
    FiBarChart2,
    FiClock,
    FiAlertCircle,
} from 'react-icons/fi';
import { TbPill } from 'react-icons/tb';
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

const reminderIntervalOptions = [
    { value: '2', label: 'Every 2 hours' },
    { value: '4', label: 'Every 4 hours' },
    { value: '6', label: 'Every 6 hours' },
    { value: '8', label: 'Every 8 hours' },
    { value: '12', label: 'Every 12 hours' },
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
    reminderInterval: string;
    pushNotifications: boolean;
    insightNotifications: boolean;
    medicationReminders: boolean;
    weeklySummary: boolean;
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
    const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('default');
    const [isExporting, setIsExporting] = useState(false);
    const reminderIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [reminderActive, setReminderActive] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isDirty },
    } = useForm<ProfileFormData>();

    const watchedUnit = watch('preferredUnit');
    const watchedMin = watch('targetGlucoseMin');
    const watchedMax = watch('targetGlucoseMax');
    const watchedPush = watch('pushNotifications');
    const watchedReminder = watch('reminderEnabled');

    const menuItems = [
        { id: 'profile', label: 'Profile', icon: FiUser },
        { id: 'health', label: 'Health Info', icon: FiHeart },
        { id: 'targets', label: 'Glucose Targets', icon: FiTarget },
        { id: 'notifications', label: 'Notifications', icon: FiBell },
        { id: 'preferences', label: 'Preferences', icon: FiGlobe },
        { id: 'data', label: 'Data & Export', icon: FiDownload },
        { id: 'account', label: 'Account', icon: FiShield },
    ];

    useEffect(() => {
        // Check push notification support
        if ('Notification' in window) {
            setPushPermission(Notification.permission);
        } else {
            setPushPermission('unsupported');
        }
    }, []);

    // ── Reminder scheduling logic ──
    const fireReminder = useCallback(() => {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;

        const messages = [
            "Time to log your glucose reading!",
            "Don't forget to check your blood sugar.",
            "Stay on track — log a glucose reading now.",
            "Quick reminder: how's your glucose doing?",
            "It's been a while — let's log a reading!",
        ];
        const body = messages[Math.floor(Math.random() * messages.length)];

        try {
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.ready.then((reg) => {
                    reg.showNotification('Bluely Reminder', {
                        body,
                        icon: '/icons/android-chrome-192x192.png',
                        badge: '/icons/android-chrome-192x192.png',
                        tag: 'glucose-reminder',
                    });
                });
            } else {
                new Notification('Bluely Reminder', {
                    body,
                    icon: '/icons/android-chrome-192x192.png',
                });
            }
        } catch (err) {
            console.warn('Failed to show notification:', err);
        }
    }, []);

    const startReminderSchedule = useCallback((intervalHours: number) => {
        // Clear existing
        if (reminderIntervalRef.current) {
            clearInterval(reminderIntervalRef.current);
            reminderIntervalRef.current = null;
        }

        if (!('Notification' in window) || Notification.permission !== 'granted') return;

        const ms = intervalHours * 60 * 60 * 1000;
        reminderIntervalRef.current = setInterval(() => {
            fireReminder();
        }, ms);

        setReminderActive(true);

        // Save schedule info to localStorage for persistence awareness
        localStorage.setItem('bluely-reminder', JSON.stringify({
            enabled: true,
            intervalHours,
            startedAt: Date.now(),
        }));
    }, [fireReminder]);

    const stopReminderSchedule = useCallback(() => {
        if (reminderIntervalRef.current) {
            clearInterval(reminderIntervalRef.current);
            reminderIntervalRef.current = null;
        }
        setReminderActive(false);
        localStorage.removeItem('bluely-reminder');
    }, []);

    // Restore reminders from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('bluely-reminder');
        if (saved) {
            try {
                const { enabled, intervalHours } = JSON.parse(saved);
                if (enabled && 'Notification' in window && Notification.permission === 'granted') {
                    startReminderSchedule(intervalHours);
                }
            } catch {
                // ignore
            }
        }

        return () => {
            if (reminderIntervalRef.current) {
                clearInterval(reminderIntervalRef.current);
            }
        };
    }, [startReminderSchedule]);

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
                    reminderInterval: '4',
                    pushNotifications: Notification.permission === 'granted',
                    insightNotifications: true,
                    medicationReminders: true,
                    weeklySummary: false,
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

    const requestPushPermission = async () => {
        if (!('Notification' in window)) return;

        try {
            const permission = await Notification.requestPermission();
            setPushPermission(permission);
            setValue('pushNotifications', permission === 'granted', { shouldDirty: true });

            if (permission === 'granted') {
                // Show a test notification
                new Notification('Bluely', {
                    body: 'Push notifications enabled! You\'ll receive glucose reminders here.',
                    icon: '/icons/android-chrome-192x192.png',
                });
            }
        } catch (err) {
            console.error('Error requesting notification permission:', err);
        }
    };

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
                reminderEnabled: data.reminderEnabled,
            });

            // ── Start/stop actual browser reminders ──
            if (data.reminderEnabled && pushPermission === 'granted') {
                const hours = parseInt(data.reminderInterval) || 4;
                startReminderSchedule(hours);
            } else {
                stopReminderSchedule();
            }

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Error saving settings:', err);
            setError('Failed to save settings. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleExportAll = async () => {
        if (!user) return;
        setIsExporting(true);
        try {
            // Fetch all readings
            const readingsRes = await api.getGlucoseReadings({ firebaseUid: user.uid, limit: 10000 });
            const readings = readingsRes.readings;

            // Build CSV
            const headers = ['Date', 'Time', 'Value (mg/dL)', 'Reading Type', 'Meal Context', 'Activity Context', 'Medication', 'Notes'];
            const rows = readings.map((r: { recordedAt: string; value: number; readingType: string; mealContext?: string; activityContext?: string; medicationName?: string; notes?: string }) => [
                new Date(r.recordedAt).toLocaleDateString(),
                new Date(r.recordedAt).toLocaleTimeString(),
                r.value,
                r.readingType,
                r.mealContext || '',
                r.activityContext || '',
                r.medicationName || '',
                r.notes || '',
            ]);

            const csv = [
                headers.join(','),
                ...rows.map((row: (string | number)[]) => row.map((v: string | number) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
            ].join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bluely-all-data-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed:', err);
            setError('Failed to export data. Please try again.');
        } finally {
            setIsExporting(false);
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
                {/* Sidebar */}
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

                {/* Main Content */}
                <div className="lg:col-span-3 space-y-6">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        {/* ───── Profile ───── */}
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

                        {/* ───── Health Info ───── */}
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
                                            <p className="text-sm text-blue-800"><strong>Why we ask:</strong> Your health information helps Bluely provide more relevant insights based on your logged data patterns.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* ───── Targets ───── */}
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

                        {/* ───── Notifications ───── */}
                        {activeSection === 'notifications' && (
                            <div className="space-y-6">
                                {/* Push Notifications */}
                                <Card className="border-0 shadow-lg shadow-gray-100">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                                <FiBell className="w-6 h-6 text-orange-600" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                                                <p className="text-gray-500 text-sm">Control how and when Bluely notifies you</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Browser Push Permission */}
                                            <div className={`p-4 rounded-xl border-2 transition-all ${pushPermission === 'granted' ? 'bg-green-50 border-green-200' : pushPermission === 'denied' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${pushPermission === 'granted' ? 'bg-green-100' : pushPermission === 'denied' ? 'bg-red-100' : 'bg-blue-100'}`}>
                                                            <FiBell className={`w-5 h-5 ${pushPermission === 'granted' ? 'text-green-600' : pushPermission === 'denied' ? 'text-red-600' : 'text-blue-600'}`} />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">Browser Push Notifications</p>
                                                            <p className="text-sm text-gray-500">
                                                                {pushPermission === 'granted'
                                                                    ? 'Enabled — you\'ll receive alerts in your browser'
                                                                    : pushPermission === 'denied'
                                                                        ? 'Blocked — update your browser settings to enable'
                                                                        : pushPermission === 'unsupported'
                                                                            ? 'Not supported in this browser'
                                                                            : 'Allow Bluely to send you important alerts'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {pushPermission === 'granted' ? (
                                                        <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                                                            <FiCheck className="w-4 h-4" /> Enabled
                                                        </span>
                                                    ) : pushPermission !== 'denied' && pushPermission !== 'unsupported' ? (
                                                        <Button type="button" size="sm" onClick={requestPushPermission}>
                                                            Enable
                                                        </Button>
                                                    ) : null}
                                                </div>
                                            </div>

                                            {/* Reading Reminders */}
                                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                        <FiClock className="w-5 h-5 text-green-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">Reading Reminders</p>
                                                        <p className="text-sm text-gray-500">
                                                            {reminderActive
                                                                ? 'Active — you\'ll receive periodic reminders'
                                                                : 'Get reminded to log your glucose'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {reminderActive && (
                                                        <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                                                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                                            Active
                                                        </span>
                                                    )}
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input type="checkbox" className="sr-only peer" {...register('reminderEnabled')} />
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#1F2F98]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1F2F98]"></div>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Reminder Interval — show only when reminders enabled */}
                                            {watchedReminder && (
                                                <div className="p-4 bg-gray-50 rounded-xl ml-4 border-l-4 border-[#1F2F98] space-y-3">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        <FiClock className="w-4 h-4 inline mr-1" /> Reminder Frequency
                                                    </label>
                                                    <Select options={reminderIntervalOptions} {...register('reminderInterval')} />

                                                    {pushPermission === 'granted' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => fireReminder()}
                                                            className="text-sm text-[#1F2F98] hover:underline font-medium flex items-center gap-1"
                                                        >
                                                            <FiBell className="w-3.5 h-3.5" />
                                                            Send a test reminder now
                                                        </button>
                                                    )}
                                                    {pushPermission !== 'granted' && (
                                                        <p className="text-xs text-amber-600">
                                                            Enable browser push notifications above to activate reminders.
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Insight Notifications */}
                                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                        <FiAlertCircle className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">Insight Alerts</p>
                                                        <p className="text-sm text-gray-500">Alerts when readings are out of range</p>
                                                    </div>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" {...register('insightNotifications')} />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#1F2F98]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1F2F98]"></div>
                                                </label>
                                            </div>

                                            {/* Medication Reminders */}
                                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                                                        <TbPill className="w-5 h-5 text-violet-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">Medication Reminders</p>
                                                        <p className="text-sm text-gray-500">Reminders to log medications</p>
                                                    </div>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" {...register('medicationReminders')} />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#1F2F98]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1F2F98]"></div>
                                                </label>
                                            </div>

                                            {/* Weekly Summary */}
                                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                        <FiBarChart2 className="w-5 h-5 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">Weekly Summary</p>
                                                        <p className="text-sm text-gray-500">A weekly overview of your trends</p>
                                                    </div>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" {...register('weeklySummary')} />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#1F2F98]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1F2F98]"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* ───── Preferences ───── */}
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

                        {/* ───── Data & Export ───── */}
                        {activeSection === 'data' && (
                            <Card className="border-0 shadow-lg shadow-gray-100">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                            <FiDownload className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Data & Export</h2>
                                            <p className="text-gray-500 text-sm">Download and share your health data</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <button
                                            type="button"
                                            onClick={handleExportAll}
                                            disabled={isExporting}
                                            className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><FiDownload className="w-5 h-5 text-green-600" /></div>
                                                <div className="text-left">
                                                    <p className="font-medium text-gray-900">Export All Data (CSV)</p>
                                                    <p className="text-sm text-gray-500">Download all glucose readings as a spreadsheet</p>
                                                </div>
                                            </div>
                                            {isExporting ? <LoadingSpinner size="sm" /> : <FiChevronRight className="w-5 h-5 text-gray-400" />}
                                        </button>
                                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                            <p className="text-sm text-blue-800">
                                                <strong>Tip:</strong> You can also export filtered readings from the{' '}
                                                <a href="/history" className="text-[#1F2F98] underline font-medium">History</a>{' '}
                                                page using the Export button. The printable report is formatted for sharing with your healthcare provider.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* ───── Account ───── */}
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

                        {/* Save button — visible for all sections except account */}
                        {activeSection !== 'account' && activeSection !== 'data' && (
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
