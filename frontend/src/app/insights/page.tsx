'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, Button, LoadingSpinner } from '@/components/ui';
import { FiTrendingUp, FiSun, FiMoon, FiActivity, FiTarget, FiDroplet, FiArrowRight } from 'react-icons/fi';
import api from '@/lib/api';

interface Reading {
    _id: string;
    value: number;
    unit: string;
    readingType: string;
    recordedAt: string;
    mealContext?: string;
    activityContext?: string;
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

interface Insight {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
}

export default function InsightsPage() {
    const { user } = useAuth();
    const [readings, setReadings] = useState<Reading[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [insights, setInsights] = useState<Insight[]>([]);

    const MINIMUM_READINGS = 21;

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                const readingsData = await api.getGlucoseReadings({
                    firebaseUid: user.uid,
                    limit: 100
                }) as ReadingsResponse;

                setReadings(readingsData.readings);

                // Generate insights if enough data
                if (readingsData.readings.length >= MINIMUM_READINGS) {
                    const generatedInsights = generateInsights(readingsData.readings);
                    setInsights(generatedInsights);
                }
            } catch (error) {
                console.error('Error fetching readings:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const generateInsights = (readings: Reading[]): Insight[] => {
        const insightsList: Insight[] = [];

        // Analyze morning vs evening readings
        const morningReadings = readings.filter(r => {
            const hour = new Date(r.recordedAt).getHours();
            return hour >= 5 && hour < 12;
        });
        const eveningReadings = readings.filter(r => {
            const hour = new Date(r.recordedAt).getHours();
            return hour >= 17 && hour < 22;
        });

        if (morningReadings.length >= 5 && eveningReadings.length >= 5) {
            const morningAvg = morningReadings.reduce((sum, r) => sum + r.value, 0) / morningReadings.length;
            const eveningAvg = eveningReadings.reduce((sum, r) => sum + r.value, 0) / eveningReadings.length;

            if (eveningAvg > morningAvg + 15) {
                insightsList.push({
                    id: 'evening-pattern',
                    title: 'Your Glucose Pattern',
                    description: 'Over the past week, your blood glucose levels tend to be higher after evening meals compared to mornings. This suggests that meal timing or food choices in the evening may be influencing your readings.',
                    icon: FiMoon,
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-50',
                });
            } else if (morningAvg > eveningAvg + 15) {
                insightsList.push({
                    id: 'morning-pattern',
                    title: 'Your Glucose Pattern',
                    description: 'Your morning readings tend to be higher than your evening readings. This is sometimes called the "dawn phenomenon" and is common for many people with diabetes.',
                    icon: FiSun,
                    color: 'text-orange-600',
                    bgColor: 'bg-orange-50',
                });
            } else {
                insightsList.push({
                    id: 'stable-pattern',
                    title: 'Your Glucose Pattern',
                    description: 'Your glucose levels appear relatively stable throughout the day. This is a positive sign that your current routine is working well for you.',
                    icon: FiTarget,
                    color: 'text-green-600',
                    bgColor: 'bg-green-50',
                });
            }
        }

        // Analyze activity impact
        const activityReadings = readings.filter(r =>
            r.activityContext && r.activityContext.toLowerCase().includes('exercise')
        );
        const nonActivityReadings = readings.filter(r => !r.activityContext);

        if (activityReadings.length >= 3 && nonActivityReadings.length >= 10) {
            const activityAvg = activityReadings.reduce((sum, r) => sum + r.value, 0) / activityReadings.length;
            const nonActivityAvg = nonActivityReadings.reduce((sum, r) => sum + r.value, 0) / nonActivityReadings.length;

            if (activityAvg < nonActivityAvg - 10) {
                insightsList.push({
                    id: 'activity-impact',
                    title: 'Activity Impact',
                    description: 'On days with physical activity, your average glucose levels were lower than usual. This shows that movement is helping your body manage blood sugar better.',
                    icon: FiActivity,
                    color: 'text-green-600',
                    bgColor: 'bg-green-50',
                });
            }
        }

        // Analyze meal timing
        const afterMealReadings = readings.filter(r =>
            r.readingType === 'after_meal' ||
            (r.mealContext && r.mealContext.toLowerCase().includes('after'))
        );
        const beforeMealReadings = readings.filter(r =>
            r.readingType === 'before_meal' || r.readingType === 'fasting'
        );

        if (afterMealReadings.length >= 5 && beforeMealReadings.length >= 5) {
            const afterMealAvg = afterMealReadings.reduce((sum, r) => sum + r.value, 0) / afterMealReadings.length;
            const beforeMealAvg = beforeMealReadings.reduce((sum, r) => sum + r.value, 0) / beforeMealReadings.length;

            if (afterMealAvg > beforeMealAvg + 30) {
                insightsList.push({
                    id: 'meal-impact',
                    title: 'Meal Impact',
                    description: 'Your glucose levels tend to rise noticeably after meals. This is normal, but paying attention to portion sizes and food choices may help keep post-meal levels more stable.',
                    icon: FiTrendingUp,
                    color: 'text-amber-600',
                    bgColor: 'bg-amber-50',
                });
            }
        }

        // If no specific insights, add a general one
        if (insightsList.length === 0) {
            insightsList.push({
                id: 'general-insight',
                title: 'Keep Tracking',
                description: 'We are analyzing your glucose patterns. Continue logging readings at different times of day to help us provide more personalized insights.',
                icon: FiDroplet,
                color: 'text-blue-600',
                bgColor: 'bg-blue-50',
            });
        }

        return insightsList;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const totalReadings = readings.length;
    const hasEnoughData = totalReadings >= MINIMUM_READINGS;
    const remainingReadings = MINIMUM_READINGS - totalReadings;
    const progressPercentage = Math.min((totalReadings / MINIMUM_READINGS) * 100, 100);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Insights</h1>
                <p className="text-gray-600 mt-1">
                    Understand your glucose patterns in plain language
                </p>
            </div>

            {!hasEnoughData ? (
                /* Not Enough Data State */
                <Card className="border-blue-100">
                    <CardContent>
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FiTrendingUp className="w-8 h-8 text-blue-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                Not enough data yet
                            </h2>
                            <p className="text-gray-600 mb-4 max-w-md mx-auto">
                                Bluely needs at least {MINIMUM_READINGS} readings to generate reliable insights about your glucose patterns.
                            </p>
                            <p className="text-blue-600 font-medium mb-6">
                                You&apos;ve logged {totalReadings} reading{totalReadings !== 1 ? 's' : ''} so far.
                                {remainingReadings > 0 && ` Keep going — you're almost there!`}
                            </p>

                            {/* Progress Bar */}
                            <div className="max-w-xs mx-auto mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-500">Progress</span>
                                    <span className="text-sm font-medium text-gray-700">
                                        {totalReadings} / {MINIMUM_READINGS}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                        style={{ width: `${progressPercentage}%` }}
                                    ></div>
                                </div>
                            </div>

                            <Link href="/glucose">
                                <Button>
                                    <FiDroplet className="w-4 h-4 mr-2" />
                                    Log a Reading
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                /* Insights Display */
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Based on {totalReadings} readings
                        </p>
                    </div>

                    {insights.map((insight) => {
                        const Icon = insight.icon;
                        return (
                            <Card key={insight.id} className="shadow-sm hover:shadow-md transition-shadow">
                                <CardContent>
                                    <div className="flex items-start space-x-4">
                                        <div className={`w-12 h-12 ${insight.bgColor} rounded-full flex items-center justify-center shrink-0`}>
                                            <Icon className={`w-6 h-6 ${insight.color}`} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 mb-2">
                                                {insight.title}
                                            </h3>
                                            <p className="text-gray-600 leading-relaxed">
                                                {insight.description}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}

                    {/* Tips for Better Insights */}
                    <Card className="bg-gray-50 border-gray-200">
                        <CardHeader>
                            <CardTitle className="text-base">Tips for Better Insights</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start space-x-2">
                                    <span className="text-blue-600 mt-0.5">•</span>
                                    <span>Log readings at consistent times each day</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <span className="text-blue-600 mt-0.5">•</span>
                                    <span>Add notes about meals and activities when logging</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <span className="text-blue-600 mt-0.5">•</span>
                                    <span>Try to take readings before and after meals</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <span className="text-blue-600 mt-0.5">•</span>
                                    <span>The more readings you log, the better Bluely can understand your patterns</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* View History Link */}
                    <Link href="/history" className="block">
                        <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <FiTrendingUp className="w-5 h-5 text-blue-600" />
                                        <span className="font-medium text-gray-900">View Full History</span>
                                    </div>
                                    <FiArrowRight className="w-5 h-5 text-gray-400" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            )}
        </div>
    );
}
