'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, Button, LoadingSpinner, Select } from '@/components/ui';
import {
    FiCalendar,
    FiFilter,
    FiTrash2,
    FiChevronLeft,
    FiChevronRight,
    FiGrid,
    FiList,
    FiDownload,
    FiShare2,
    FiFileText,
} from 'react-icons/fi';
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
    medicationTaken?: boolean;
    medicationName?: string;
    medicationType?: string;
    medicationDose?: number;
    medicationDoseUnit?: string;
    injectionSite?: string;
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

type ViewMode = 'cards' | 'table';

export default function HistoryPage() {
    const { user } = useAuth();
    const [readings, setReadings] = useState<Reading[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState('30');
    const [currentPage, setCurrentPage] = useState(1);
    const [targetMin, setTargetMin] = useState(70);
    const [targetMax, setTargetMax] = useState(180);
    const [viewMode, setViewMode] = useState<ViewMode>('cards');
    const [showExportMenu, setShowExportMenu] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);

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

    // Close export menu on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
                setShowExportMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    const getGlucoseBadge = (value: number) => {
        if (value < targetMin) return 'bg-red-100 text-red-700';
        if (value > targetMax) return 'bg-orange-100 text-orange-700';
        return 'bg-green-100 text-green-700';
    };

    // Group readings by date
    const groupedReadings = readings.reduce((groups, reading) => {
        const date = format(new Date(reading.recordedAt), 'yyyy-MM-dd');
        if (!groups[date]) groups[date] = [];
        groups[date].push(reading);
        return groups;
    }, {} as Record<string, Reading[]>);

    // ─── Export functions ───────────────────────────────────────────────

    const buildExportData = () => {
        return readings.map((r) => ({
            Date: format(new Date(r.recordedAt), 'yyyy-MM-dd'),
            Time: format(new Date(r.recordedAt), 'HH:mm'),
            'Value (mg/dL)': r.value,
            Status: getGlucoseLabel(r.value),
            'Reading Type': readingTypeLabels[r.readingType] || r.readingType,
            'Meal Context': r.mealContext || '',
            'Activity Context': r.activityContext || '',
            Medication: r.medicationTaken
                ? `${r.medicationName || ''}${r.medicationDose ? ` ${r.medicationDose}${r.medicationDoseUnit || ''}` : ''}`
                : '',
            'Injection Site': r.injectionSite?.replace(/_/g, ' ') || '',
            Notes: r.notes || '',
        }));
    };

    const exportCSV = () => {
        const data = buildExportData();
        if (data.length === 0) return;
        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','),
            ...data.map((row) =>
                headers.map((h) => {
                    const val = String((row as Record<string, string | number>)[h]).replace(/"/g, '""');
                    return `"${val}"`;
                }).join(',')
            ),
        ];
        downloadFile(csvRows.join('\n'), 'bluely-glucose-readings.csv', 'text/csv');
        setShowExportMenu(false);
    };

    const exportPDF = () => {
        const data = buildExportData();
        if (data.length === 0) return;

        const userName = user?.displayName || 'Patient';
        const rangeLabel = dateRangeOptions.find((o) => o.value === dateRange)?.label || '';
        const now = format(new Date(), 'MMMM d, yyyy');

        // Calculate stats
        const values = readings.map((r) => r.value);
        const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const inRange = values.filter((v) => v >= targetMin && v <= targetMax).length;
        const inRangePct = Math.round((inRange / values.length) * 100);

        let html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Glucose Report - ${userName}</title>
<style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1a1a2e; max-width: 800px; margin: 0 auto; }
    h1 { color: #1F2F98; font-size: 24px; margin-bottom: 4px; }
    .subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }
    .stats { display: flex; gap: 16px; margin-bottom: 24px; }
    .stat-box { flex: 1; padding: 16px; border-radius: 12px; background: #f8f9fb; border: 1px solid #e5e7eb; text-align: center; }
    .stat-value { font-size: 28px; font-weight: 700; }
    .stat-label { font-size: 12px; color: #666; margin-top: 4px; }
    .green { color: #16a34a; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 16px; }
    th { background: #1F2F98; color: white; padding: 10px 12px; text-align: left; }
    td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
    tr:nth-child(even) { background: #f9fafb; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-weight: 600; font-size: 11px; }
    .badge-green { background: #dcfce7; color: #16a34a; }
    .badge-orange { background: #ffedd5; color: #ea580c; }
    .badge-red { background: #fee2e2; color: #dc2626; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #999; text-align: center; }
    @media print { body { padding: 20px; } }
</style>
</head><body>
<h1>Bluely Glucose Report</h1>
<p class="subtitle">Prepared for <strong>${userName}</strong> &middot; ${rangeLabel} &middot; Generated ${now}</p>
<div class="stats">
    <div class="stat-box"><div class="stat-value">${avg}</div><div class="stat-label">Avg (mg/dL)</div></div>
    <div class="stat-box"><div class="stat-value green">${inRangePct}%</div><div class="stat-label">In Range</div></div>
    <div class="stat-box"><div class="stat-value">${min} – ${max}</div><div class="stat-label">Min – Max</div></div>
    <div class="stat-box"><div class="stat-value">${values.length}</div><div class="stat-label">Readings</div></div>
</div>
<p style="font-size:12px;color:#666;">Target range: ${targetMin} – ${targetMax} mg/dL</p>
<table>
<thead><tr><th>Date</th><th>Time</th><th>Value</th><th>Status</th><th>Type</th><th>Context</th><th>Medication</th><th>Notes</th></tr></thead>
<tbody>`;

        data.forEach((row) => {
            const status = row.Status;
            const badgeClass = status === 'In Range' ? 'badge-green' : status === 'High' ? 'badge-orange' : 'badge-red';
            html += `<tr>
<td>${row.Date}</td>
<td>${row.Time}</td>
<td><strong>${row['Value (mg/dL)']}</strong></td>
<td><span class="badge ${badgeClass}">${status}</span></td>
<td>${row['Reading Type']}</td>
<td>${row['Meal Context'] || row['Activity Context'] || '—'}</td>
<td>${row.Medication || '—'}</td>
<td>${row.Notes || '—'}</td>
</tr>`;
        });

        html += `</tbody></table>
<div class="footer">
    <p>Generated by Bluely &middot; Diabetes Self-Management Platform</p>
    <p>This report is based on self-reported data and is not a substitute for professional medical advice.</p>
</div>
</body></html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
            printWindow.addEventListener('load', () => {
                printWindow.print();
            });
        }
        setShowExportMenu(false);
    };

    const downloadFile = (content: string, filename: string, type: string) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ─── Table View ─────────────────────────────────────────────────────

    const renderTableView = () => (
        <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="text-left px-4 py-3 font-semibold text-gray-600">Date & Time</th>
                            <th className="text-left px-4 py-3 font-semibold text-gray-600">Value</th>
                            <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                            <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
                            <th className="text-left px-4 py-3 font-semibold text-gray-600">Context</th>
                            <th className="text-left px-4 py-3 font-semibold text-gray-600">Medication</th>
                            <th className="text-right px-4 py-3 font-semibold text-gray-600"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {readings.map((reading, idx) => (
                            <tr
                                key={reading._id}
                                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                            >
                                <td className="px-4 py-3">
                                    <div className="font-medium text-gray-900">{format(new Date(reading.recordedAt), 'MMM d, yyyy')}</div>
                                    <div className="text-xs text-gray-500">{format(new Date(reading.recordedAt), 'h:mm a')}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`text-lg font-bold ${getGlucoseColor(reading.value)}`}>
                                        {reading.value}
                                    </span>
                                    <span className="text-xs text-gray-400 ml-1">{reading.unit}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getGlucoseBadge(reading.value)}`}>
                                        {getGlucoseLabel(reading.value)}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {readingTypeLabels[reading.readingType] || reading.readingType}
                                </td>
                                <td className="px-4 py-3 text-gray-500 text-xs max-w-[160px] truncate">
                                    {reading.mealContext || reading.activityContext || '—'}
                                </td>
                                <td className="px-4 py-3 text-gray-500 text-xs">
                                    {reading.medicationTaken
                                        ? `${reading.medicationName || ''}${reading.medicationDose ? ` ${reading.medicationDose}${reading.medicationDoseUnit || ''}` : ''}`
                                        : '—'}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={() => handleDelete(reading._id)}
                                        className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                    >
                                        <FiTrash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );

    // ─── Card View ──────────────────────────────────────────────────────

    const renderCardView = () => (
        <>
            {Object.entries(groupedReadings).map(([date, dayReadings]) => (
                <Card key={date} className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
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
                                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border ${getGlucoseBg(reading.value)}`}
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="text-center">
                                            <div className={`text-2xl font-bold ${getGlucoseColor(reading.value)}`}>
                                                {reading.value}
                                            </div>
                                            <div className="text-xs text-gray-500">{reading.unit}</div>
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${getGlucoseBadge(reading.value)}`}>
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
                                            {reading.medicationTaken && reading.medicationName && (
                                                <div className="text-xs text-violet-600 mt-1">
                                                    💊 {reading.medicationName}
                                                    {reading.medicationDose && ` ${reading.medicationDose}${reading.medicationDoseUnit || ''}`}
                                                    {reading.injectionSite && ` · ${reading.injectionSite.replace(/_/g, ' ')}`}
                                                </div>
                                            )}
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
        </>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Glucose History</h1>
                    <p className="text-gray-600 mt-1">View and manage your blood glucose readings</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* View toggle */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                        <button
                            onClick={() => setViewMode('cards')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'cards' ? 'bg-white shadow text-[#1F2F98]' : 'text-gray-500 hover:text-gray-700'}`}
                            title="Card view"
                        >
                            <FiGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow text-[#1F2F98]' : 'text-gray-500 hover:text-gray-700'}`}
                            title="Table view"
                        >
                            <FiList className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Date filter */}
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

                    {/* Export button */}
                    <div className="relative" ref={exportRef}>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            disabled={readings.length === 0}
                        >
                            <FiShare2 className="w-4 h-4 mr-1" />
                            Export
                        </Button>
                        {showExportMenu && (
                            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                                <button
                                    onClick={exportCSV}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                                >
                                    <FiDownload className="w-4 h-4 text-green-600" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Download CSV</p>
                                        <p className="text-xs text-gray-500">Spreadsheet format</p>
                                    </div>
                                </button>
                                <button
                                    onClick={exportPDF}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-t border-gray-100"
                                >
                                    <FiFileText className="w-4 h-4 text-[#1F2F98]" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Print / Save PDF</p>
                                        <p className="text-xs text-gray-500">Share with your doctor</p>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
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
                <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                    <CardContent className="text-center py-12">
                        <FiCalendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No readings found</h3>
                        <p className="text-gray-600">Start tracking your blood glucose to see your history here.</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {viewMode === 'table' ? renderTableView() : renderCardView()}

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
                                onClick={() => setCurrentPage((p) => Math.min(pagination!.pages, p + 1))}
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
