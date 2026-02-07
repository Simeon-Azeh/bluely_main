'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, Button, LoadingSpinner } from '@/components/ui';
import { FiPlus, FiTrendingUp, FiTrendingDown, FiTarget, FiActivity, FiInfo, FiCheckCircle, FiCircle, FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import { format, isToday } from 'date-fns';
import api from '@/lib/api';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';

interface Stats {
    totalReadings: number;
    averageGlucose: number | null;
    minGlucose: number | null;
    maxGlucose: number | null;
    inRangePercentage: number | null;
    belowRangePercentage: number | null;
    aboveRangePercentage: number | null;
    targetMin: number;
    targetMax: number;
    readingsByDay: Array<{
        date: string;
        average: number;
        readings: Array<{
            value: number;
            recordedAt: string;
        }>;
    }>;
}

interface Reading {
    _id: string;
    value: number;
    unit: string;
    readingType: string;
    recordedAt: string;
    notes?: string;
}

interface ReadingsResponse {
    readings: Reading[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

export default function DashboardPage() {
    const { user, userProfile } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentReadings, setRecentReadings] = useState<Reading[]>([]);
    const [allReadings, setAllReadings] = useState<Reading[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [backendError, setBackendError] = useState(false);

    const isOnboardingComplete = userProfile?.onboardingCompleted === true;

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                setBackendError(false);
                const [statsData, readingsData, allReadingsData] = await Promise.all([
                    api.getGlucoseStats(user.uid, 7) as Promise<Stats>,
                    api.getGlucoseReadings({ firebaseUid: user.uid, limit: 5 }) as Promise<ReadingsResponse>,
                    api.getGlucoseReadings({ firebaseUid: user.uid, limit: 100 }) as Promise<ReadingsResponse>,
                ]);

                setStats(statsData);
                setRecentReadings(readingsData.readings);
                setAllReadings(allReadingsData.readings);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setBackendError(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user]);

    // Count today's readings
    const todaysReadingsCount = allReadings.filter(reading =>
        isToday(new Date(reading.recordedAt))
    ).length;

    const recommendedReadings = 3;
    const progressPercentage = Math.min((todaysReadingsCount / recommendedReadings) * 100, 100);

    const getGlucoseColor = (value: number, targetMin: number, targetMax: number) => {
        if (value < targetMin) return 'text-red-600';
        if (value > targetMax) return 'text-orange-600';
        return 'text-green-600';
    };

    const getGlucoseBg = (value: number, targetMin: number, targetMax: number) => {
        if (value < targetMin) return 'bg-red-50';
        if (value > targetMax) return 'bg-orange-50';
        return 'bg-green-50';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    // Prepare chart data
    const chartData = stats?.readingsByDay.map(day => ({
        date: format(new Date(day.date), 'MMM d'),
        average: Math.round(day.average),
        readings: day.readings.length,
    })) || [];

    return (
        <div className="space-y-6">
            {/* Welcome section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Welcome back, {user?.displayName?.split(' ')[0] || 'there'}!
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Here&apos;s an overview of your glucose levels
                    </p>
                </div>
                {isOnboardingComplete && (
                    <Link href="/glucose">
                        <Button>
                            <FiPlus className="w-4 h-4 mr-2" />
                            Log Reading
                        </Button>
                    </Link>
                )}
            </div>

            {/* Backend Connection Error */}
            {backendError && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent>
                        <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                                <FiAlertCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-red-800 mb-1">Connection Issue</h3>
                                <p className="text-sm text-red-700">
                                    Unable to connect to the server. Please make sure the backend is running and try again.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Onboarding Required Card */}
            {!isOnboardingComplete && (
                <Card className="border-amber-200 bg-amber-50">
                    <CardContent>
                        <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                                <FiAlertCircle className="w-6 h-6 text-amber-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-amber-800 text-lg mb-2">Complete Your Profile</h3>
                                <p className="text-sm text-amber-700 mb-4">
                                    To get personalized insights and start tracking your glucose levels effectively,
                                    please complete the onboarding process. It only takes a minute!
                                </p>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white text-amber-700 border border-amber-200">
                                        Set your diabetes type
                                    </span>
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white text-amber-700 border border-amber-200">
                                        Configure target glucose range
                                    </span>
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white text-amber-700 border border-amber-200">
                                        Choose your preferred units
                                    </span>
                                </div>
                                <Link href="/onboarding">
                                    <Button className="bg-amber-600 hover:bg-amber-700">
                                        Complete Onboarding
                                        <FiArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Only show features if onboarding is complete */}
            {isOnboardingComplete && (
                <>
                    {/* Recommended Daily Readings Card */}
                    <Card className="border-blue-100 bg-blue-50/30">
                        <CardContent>
                            <div className="flex items-start space-x-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                                    <FiInfo className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 mb-2">Recommended Daily Readings</h3>
                                    <p className="text-sm text-gray-600 mb-3">
                                        For meaningful insights, we recommend taking 3 readings per day:
                                    </p>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-200">
                                            Before meals
                                        </span>
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-200">
                                            After meals
                                        </span>
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-200">
                                            Before bedtime
                                        </span>
                                    </div>

                                    {/* Progress Indicator */}
                                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700">Today&apos;s Progress</span>
                                            <span className="text-sm font-semibold text-blue-600">
                                                {todaysReadingsCount} of {recommendedReadings} readings
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                                style={{ width: `${progressPercentage}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex items-center mt-2 space-x-4">
                                            {[1, 2, 3].map((num) => (
                                                <div key={num} className="flex items-center space-x-1">
                                                    {todaysReadingsCount >= num ? (
                                                        <FiCheckCircle className="w-4 h-4 text-green-500" />
                                                    ) : (
                                                        <FiCircle className="w-4 h-4 text-gray-300" />
                                                    )}
                                                    <span className="text-xs text-gray-500">Reading {num}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Average (7 days)</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {stats?.averageGlucose || '--'}
                                            <span className="text-sm font-normal text-gray-500 ml-1">mg/dL</span>
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                                        <FiActivity className="w-5 h-5 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">In Range</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {stats?.inRangePercentage ?? '--'}%
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                                        <FiTarget className="w-5 h-5 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Lowest</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {stats?.minGlucose || '--'}
                                            <span className="text-sm font-normal text-gray-500 ml-1">mg/dL</span>
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                                        <FiTrendingDown className="w-5 h-5 text-red-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Highest</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {stats?.maxGlucose || '--'}
                                            <span className="text-sm font-normal text-gray-500 ml-1">mg/dL</span>
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
                                        <FiTrendingUp className="w-5 h-5 text-orange-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>7-Day Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {chartData.length > 0 ? (
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                                            <YAxis stroke="#6b7280" fontSize={12} domain={[40, 300]} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'white',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '8px',
                                                }}
                                            />
                                            <ReferenceLine
                                                y={stats?.targetMax || 180}
                                                stroke="#f59e0b"
                                                strokeDasharray="3 3"
                                                label={{ value: 'High', position: 'right', fill: '#f59e0b', fontSize: 10 }}
                                            />
                                            <ReferenceLine
                                                y={stats?.targetMin || 70}
                                                stroke="#ef4444"
                                                strokeDasharray="3 3"
                                                label={{ value: 'Low', position: 'right', fill: '#ef4444', fontSize: 10 }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="average"
                                                stroke="#2563eb"
                                                strokeWidth={2}
                                                dot={{ fill: '#2563eb', strokeWidth: 2 }}
                                                activeDot={{ r: 6 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-gray-500">
                                    <div className="text-center">
                                        <FiActivity className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                        <p>No data yet. Start by logging your first reading!</p>
                                        <Link href="/glucose">
                                            <Button className="mt-4" size="sm">
                                                <FiPlus className="w-4 h-4 mr-1" />
                                                Log Reading
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent readings */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Recent Readings</CardTitle>
                            <Link href="/history" className="text-sm text-blue-600 hover:text-blue-700">
                                View all
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {recentReadings.length > 0 ? (
                                <div className="space-y-3">
                                    {recentReadings.map((reading) => (
                                        <div
                                            key={reading._id}
                                            className={`flex items-center justify-between p-3 rounded-lg ${getGlucoseBg(
                                                reading.value,
                                                stats?.targetMin || 70,
                                                stats?.targetMax || 180
                                            )}`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div
                                                    className={`text-xl font-bold ${getGlucoseColor(
                                                        reading.value,
                                                        stats?.targetMin || 70,
                                                        stats?.targetMax || 180
                                                    )}`}
                                                >
                                                    {reading.value}
                                                    <span className="text-sm font-normal text-gray-500 ml-1">
                                                        {reading.unit}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {reading.readingType.replace('_', ' ')}
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {format(new Date(reading.recordedAt), 'MMM d, h:mm a')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No readings yet</p>
                                </div>
                            )}
                        </CardContent>
                 
                    </Card>
                </>
            )}
            </div>
    );
}

