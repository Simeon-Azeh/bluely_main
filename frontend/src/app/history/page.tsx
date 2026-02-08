'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, Button, LoadingSpinner, Select } from '@/components/ui';
import { FiCalendar, FiFilter, FiTrash2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import api from '@/lib/api';

interface Reading {
    _id: string;
    value: number;
    unit: string;
    readingType: string;
    mealContext?: string;
    activityContext?: string;
    notes?: string;
    recordedAt: string;
    createdAt: string;
}

interface Pagination {
    total: number;
    page: number;
    limit: number;
    pages: number;
}

interface GlucoseReadingsResponse {
    readings: Reading[];
    pagination: Pagination;
}

const readingTypeLabels: Record<string, string> = {
    fasting: 'Fasting',
    before_meal: 'Before Meal',
    after_meal: 'After Meal',
    bedtime: 'Bedtime',
    random: 'Random',
    other: 'Other',
};

const dateRangeOptions = [
    { value: '7', label: 'Last 7 days' },
    { value: '14', label: 'Last 14 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' },
    { value: 'all', label: 'All time' },
];

export default function HistoryPage() {
    const { user } = useAuth();
    const [readings, setReadings] = useState<Reading[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState('30');
    const [currentPage, setCurrentPage] = useState(1);
    const [targetMin, setTargetMin] = useState(70);
    const [targetMax, setTargetMax] = useState(180);

    const fetchReadings = useCallback(async () => {
        if (!user) return;

        try {
            setIsLoading(true);

            let startDate: string | undefined;
            let endDate: string | undefined;

            if (dateRange !== 'all') {
                const days = parseInt(dateRange);
                startDate = startOfDay(subDays(new Date(), days)).toISOString();
                endDate = endOfDay(new Date()).toISOString();
            }

            const data: GlucoseReadingsResponse = await api.getGlucoseReadings({
                firebaseUid: user.uid,
                page: currentPage,
                limit: 20,
                startDate,
                endDate,
            });
            setReadings(data.readings);
            setPagination(data.pagination);

            // Fetch user settings for target range
            const userData = await api.getUser(user.uid);
            setTargetMin(userData.targetGlucoseMin || 70);
            setTargetMax(userData.targetGlucoseMax || 180);
        } catch (error) {
            console.error('Error fetching readings:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user, currentPage, dateRange]);

    useEffect(() => {
        fetchReadings();
    }, [fetchReadings]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this reading?')) return;

        try {
            await api.deleteGlucoseReading(id);
            setReadings(readings.filter((r) => r._id !== id));
        } catch (error) {
            console.error('Error deleting reading:', error);
        }
    };

    const getGlucoseColor = (value: number) => {
        if (value < targetMin) return 'text-red-600';
        if (value > targetMax) return 'text-orange-600';
        return 'text-green-600';
    };

    const getGlucoseBg = (value: number) => {
        if (value < targetMin) return 'bg-red-50 border-red-100';
        if (value > targetMax) return 'bg-orange-50 border-orange-100';
        return 'bg-green-50 border-green-100';
    };

    const getGlucoseLabel = (value: number) => {
        if (value < targetMin) return 'Low';
        if (value > targetMax) return 'High';
        return 'In Range';
    };

    // Group readings by date
    const groupedReadings = readings.reduce((groups, reading) => {
        const date = format(new Date(reading.recordedAt), 'yyyy-MM-dd');
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(reading);
        return groups;
    }, {} as Record<string, Reading[]>);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Glucose History</h1>
                    <p className="text-gray-600 mt-1">
                        View and manage your blood glucose readings
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <FiFilter className="w-4 h-4 text-gray-500" />
                    <Select
                        options={dateRangeOptions}
                        value={dateRange}
                        onChange={(e) => {
                            setDateRange(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-40"
                    />
                </div>
            </div>

            {/* Summary stats */}
            {pagination && (
                <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-blue-800">
                        Showing <span className="font-semibold">{readings.length}</span> of{' '}
                        <span className="font-semibold">{pagination.total}</span> readings
                    </p>
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <LoadingSpinner size="lg" />
                </div>
            ) : readings.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-12">
                        <FiCalendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No readings found
                        </h3>
                        <p className="text-gray-600">
                            Start tracking your blood glucose to see your history here.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {Object.entries(groupedReadings).map(([date, dayReadings]) => (
                        <Card key={date}>
                            <CardHeader>
                                <CardTitle className="flex items-center text-base">
                                    <FiCalendar className="w-4 h-4 mr-2 text-gray-500" />
                                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                                    <span className="ml-auto text-sm font-normal text-gray-500">
                                        {dayReadings.length} reading{dayReadings.length !== 1 ? 's' : ''}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {dayReadings.map((reading) => (
                                        <div
                                            key={reading._id}
                                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border ${getGlucoseBg(
                                                reading.value
                                            )}`}
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="text-center">
                                                    <div
                                                        className={`text-2xl font-bold ${getGlucoseColor(
                                                            reading.value
                                                        )}`}
                                                    >
                                                        {reading.value}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{reading.unit}</div>
                                                </div>
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <span
                                                            className={`text-xs px-2 py-0.5 rounded-full ${getGlucoseBg(
                                                                reading.value
                                                            )} ${getGlucoseColor(reading.value)}`}
                                                        >
                                                            {getGlucoseLabel(reading.value)}
                                                        </span>
                                                        <span className="text-sm text-gray-600">
                                                            {readingTypeLabels[reading.readingType] || reading.readingType}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-500 mt-1">
                                                        {format(new Date(reading.recordedAt), 'h:mm a')}
                                                        {reading.mealContext && (
                                                            <span className="ml-2">• {reading.mealContext}</span>
                                                        )}
                                                    </div>
                                                    {reading.notes && (
                                                        <div className="text-sm text-gray-500 mt-1 italic">
                                                            &quot;{reading.notes}&quot;
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="mt-3 sm:mt-0">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(reading._id)}
                                                    className="text-gray-400 hover:text-red-600"
                                                >
                                                    <FiTrash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Pagination */}
                    {pagination && pagination.pages > 1 && (
                        <div className="flex items-center justify-center space-x-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                <FiChevronLeft className="w-4 h-4 mr-1" />
                                Previous
                            </Button>
                            <span className="text-sm text-gray-600">
                                Page {currentPage} of {pagination.pages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
                                disabled={currentPage === pagination.pages}
                            >
                                Next
                                <FiChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
