'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, Button, Select } from '@/components/ui';
import {
    FiCalendar, FiFilter, FiTrash2, FiChevronLeft, FiChevronRight,
    FiGrid, FiList, FiDownload, FiShare2, FiFileText,
    FiDroplet, FiCoffee, FiActivity, FiHeart,
} from 'react-icons/fi';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import api from '@/lib/api';
import { useGlucoseUnit } from '@/hooks/useGlucoseUnit';

// ─── Types ───────────────────────────────────────────────────────────────────
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
interface MealEntry {
    _id: string; firebaseUid: string;
    carbsEstimate?: number; mealType: string;
    mealCategory?: string; description?: string; timestamp: string;
}
interface ActivityEntry {
    _id: string; firebaseUid: string;
    activityLevel: string; activityType?: string;
    durationMinutes?: number; timestamp: string;
}
interface MoodEntry {
    _id: string; firebaseUid: string;
    mood: string; period: string; note?: string; createdAt: string;
}
interface Pagination { total: number; page: number; limit: number; pages: number; }
interface GlucoseReadingsResponse { readings: Reading[]; pagination: Pagination; }

// ─── Constants ───────────────────────────────────────────────────────────────
const readingTypeLabels: Record<string, string> = {
    fasting: 'Fasting', before_meal: 'Before Meal', after_meal: 'After Meal',
    bedtime: 'Bedtime', random: 'Random', other: 'Other',
};
const mealTypeLabels: Record<string, string> = {
    breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack', other: 'Other',
};
const activityIntensityLabels: Record<string, string> = {
    low: 'Light', medium: 'Moderate', high: 'Intense',
};
const moodEmojis: Record<string, string> = {
    Great: '😊', Good: '🙂', Okay: '😐', Low: '😔', Rough: '😣',
};
const periodLabels: Record<string, string> = {
    morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening',
};
const dateRangeOptions = [
    { value: '7', label: 'Last 7 days' },
    { value: '14', label: 'Last 14 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' },
    { value: 'all', label: 'All time' },
];
type ViewMode = 'cards' | 'table';
type HistoryTab = 'glucose' | 'meals' | 'activity' | 'mood';

export default function HistoryPage() {
    const { user } = useAuth();
    const { label, format: fmtGlucose, isMmol } = useGlucoseUnit();
    // Glucose state
    const [readings, setReadings] = useState<Reading[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [targetMin, setTargetMin] = useState(70);
    const [targetMax, setTargetMax] = useState(180);
    const [viewMode, setViewMode] = useState<ViewMode>('cards');
    // Other tabs state
    const [meals, setMeals] = useState<MealEntry[]>([]);
    const [activities, setActivities] = useState<ActivityEntry[]>([]);
    const [moodLogs, setMoodLogs] = useState<MoodEntry[]>([]);
    const [isLoadingOther, setIsLoadingOther] = useState(false);
    // Shared
    const [activeTab, setActiveTab] = useState<HistoryTab>('glucose');
    const [dateRange, setDateRange] = useState('30');
    const [showExportMenu, setShowExportMenu] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);

    const getDateBounds = useCallback(() => {
        if (dateRange === 'all') return { start: null as Date | null, end: null as Date | null };
        const days = parseInt(dateRange);
        return { start: startOfDay(subDays(new Date(), days)), end: endOfDay(new Date()) };
    }, [dateRange]);

    const fetchReadings = useCallback(async () => {
        if (!user) return;
        try {
            setIsLoading(true);
            const { start, end } = getDateBounds();
            const data: GlucoseReadingsResponse = await api.getGlucoseReadings({
                firebaseUid: user.uid,
                page: currentPage,
                limit: 20,
                startDate: start?.toISOString(),
                endDate: end?.toISOString(),
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
    }, [user, currentPage, dateRange, getDateBounds]);

    const fetchOtherData = useCallback(async () => {
        if (!user) return;
        try {
            setIsLoadingOther(true);
            const { start, end } = getDateBounds();
            const filterByDate = <T,>(items: T[], getDate: (item: T) => string) => {
                if (!start || !end) return items;
                return items.filter((item) => {
                    const ts = new Date(getDate(item));
                    return ts >= start && ts <= end;
                });
            };
            const [mealsRes, activitiesRes, moodRes] = await Promise.all([
                api.getMeals(user.uid, 500),
                api.getActivities(user.uid, 500),
                api.getMoodLogs(user.uid, 500),
            ]);
            setMeals(filterByDate(mealsRes.meals as MealEntry[], (m) => m.timestamp));
            setActivities(filterByDate(activitiesRes.activities as ActivityEntry[], (a) => a.timestamp));
            setMoodLogs(filterByDate(moodRes.logs as MoodEntry[], (m) => m.createdAt));
        } catch (error) {
            console.error('Error fetching other data:', error);
        } finally {
            setIsLoadingOther(false);
        }
    }, [user, dateRange, getDateBounds]);

    useEffect(() => { fetchReadings(); }, [fetchReadings]);
    useEffect(() => { fetchOtherData(); }, [fetchOtherData]);

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

    // ─── Glucose helpers ──────────────────────────────────────────────────────
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

    const groupedReadings = readings.reduce((groups, reading) => {
        const date = format(new Date(reading.recordedAt), 'yyyy-MM-dd');
        if (!groups[date]) groups[date] = [];
        groups[date].push(reading);
        return groups;
    }, {} as Record<string, Reading[]>);

    // ─── Export helpers ──────────────────────────────────────────────────────

    const downloadFile = (content: string, filename: string, type: string) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportCSV = () => {
        let rows: Record<string, string>[] = [];
        let filename = 'bluely-export.csv';

        if (activeTab === 'glucose') {
            const valueKey = `Value (${label})`;
            rows = readings.map((r) => ({
                Date: format(new Date(r.recordedAt), 'yyyy-MM-dd'),
                Time: format(new Date(r.recordedAt), 'HH:mm'),
                [valueKey]: String(fmtGlucose(r.value)),
                Status: getGlucoseLabel(r.value),
                'Reading Type': readingTypeLabels[r.readingType] || r.readingType,
                'Meal Context': r.mealContext || '',
                Medication: r.medicationTaken
                    ? `${r.medicationName || ''}${r.medicationDose ? ` ${r.medicationDose}${r.medicationDoseUnit || ''}` : ''}`
                    : '',
                Notes: r.notes || '',
            }));
            filename = 'bluely-glucose.csv';
        } else if (activeTab === 'meals') {
            rows = meals.map((m) => ({
                Date: format(new Date(m.timestamp), 'yyyy-MM-dd'),
                Time: format(new Date(m.timestamp), 'HH:mm'),
                Type: mealTypeLabels[m.mealType] || m.mealType,
                Description: m.description || '',
                'Carbs (g)': m.carbsEstimate?.toString() || '',
            }));
            filename = 'bluely-meals.csv';
        } else if (activeTab === 'activity') {
            rows = activities.map((a) => ({
                Date: format(new Date(a.timestamp), 'yyyy-MM-dd'),
                Time: format(new Date(a.timestamp), 'HH:mm'),
                Type: a.activityType || '',
                Intensity: activityIntensityLabels[a.activityLevel] || a.activityLevel,
                'Duration (min)': a.durationMinutes?.toString() || '',
            }));
            filename = 'bluely-activity.csv';
        } else if (activeTab === 'mood') {
            rows = moodLogs.map((m) => ({
                Date: format(new Date(m.createdAt), 'yyyy-MM-dd'),
                Period: periodLabels[m.period] || m.period,
                Mood: m.mood,
                Note: m.note || '',
            }));
            filename = 'bluely-mood.csv';
        }

        if (rows.length === 0) return;
        const headers = Object.keys(rows[0]);
        const csvRows = [
            headers.join(','),
            ...rows.map((row) =>
                headers.map((h) => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(',')
            ),
        ];
        downloadFile(csvRows.join('\n'), filename, 'text/csv');
        setShowExportMenu(false);
    };

    const exportFullReport = () => {
        const userName = user?.displayName || 'Patient';
        const rangeLabel = dateRangeOptions.find((o) => o.value === dateRange)?.label || '';
        const now = format(new Date(), 'MMMM d, yyyy');
        const targetMinDisplay = isMmol ? (targetMin / 18.0182).toFixed(1) : targetMin;
        const targetMaxDisplay = isMmol ? (targetMax / 18.0182).toFixed(1) : targetMax;

        const glucoseValues = readings.map((r) => r.value);
        const glucoseAvg = glucoseValues.length
            ? fmtGlucose(Math.round(glucoseValues.reduce((a, b) => a + b, 0) / glucoseValues.length))
            : '—';
        const glucoseMin = glucoseValues.length ? fmtGlucose(Math.min(...glucoseValues)) : '—';
        const glucoseMax = glucoseValues.length ? fmtGlucose(Math.max(...glucoseValues)) : '—';
        const inRange = glucoseValues.filter((v) => v >= targetMin && v <= targetMax).length;
        const tir = glucoseValues.length ? Math.round((inRange / glucoseValues.length) * 100) : 0;
        const totalCarbs = meals.reduce((s, m) => s + (m.carbsEstimate || 0), 0);
        const totalActivityMins = activities.reduce((s, a) => s + (a.durationMinutes || 0), 0);

        const css = `
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:40px;color:#1a1a2e;max-width:860px;margin:0 auto}
  h1{color:#1F2F98;font-size:26px;margin-bottom:2px}
  h2{color:#1F2F98;font-size:17px;margin:28px 0 12px;border-bottom:2px solid #e0e4ff;padding-bottom:6px}
  .sub{color:#666;font-size:13px;margin-bottom:28px}
  .stats{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:20px}
  .sb{flex:1;min-width:120px;padding:14px;border-radius:10px;background:#f8f9fb;border:1px solid #e5e7eb;text-align:center}
  .sv{font-size:24px;font-weight:700}.sl{font-size:11px;color:#666;margin-top:3px}
  .green{color:#16a34a}
  table{width:100%;border-collapse:collapse;font-size:12px;margin-top:12px}
  th{background:#1F2F98;color:#fff;padding:9px 10px;text-align:left}
  td{padding:7px 10px;border-bottom:1px solid #e5e7eb}
  tr:nth-child(even){background:#f9fafb}
  .badge{display:inline-block;padding:2px 7px;border-radius:9999px;font-weight:600;font-size:10px}
  .bg{background:#dcfce7;color:#16a34a}.bo{background:#ffedd5;color:#ea580c}.br{background:#fee2e2;color:#dc2626}
  .bb{background:#dbeafe;color:#1d4ed8}.bp{background:#ede9fe;color:#7c3aed}
  .pill{background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;padding:4px 10px;font-size:12px;display:inline-block;margin:0 4px 4px 0}
  .footer{margin-top:36px;padding-top:14px;border-top:1px solid #e5e7eb;font-size:10px;color:#999;text-align:center}
  @media print{body{padding:20px}}`;

        const glucoseTable = readings.length > 0
            ? `<table><thead><tr><th>Date</th><th>Time</th><th>Value (${label})</th><th>Status</th><th>Type</th><th>Medication</th><th>Notes</th></tr></thead><tbody>
${readings.map((r) => {
                const sl = getGlucoseLabel(r.value);
                const bc = sl === 'In Range' ? 'bg' : sl === 'High' ? 'bo' : 'br';
                const med = r.medicationTaken ? `${r.medicationName || ''}${r.medicationDose ? ` ${r.medicationDose}${r.medicationDoseUnit || ''}` : ''}` : '—';
                return `<tr><td>${format(new Date(r.recordedAt), 'MMM d, yyyy')}</td><td>${format(new Date(r.recordedAt), 'h:mm a')}</td><td><strong>${fmtGlucose(r.value)}</strong></td><td><span class="badge ${bc}">${sl}</span></td><td>${readingTypeLabels[r.readingType] || r.readingType}</td><td>${med}</td><td>${r.notes || '—'}</td></tr>`;
            }).join('')}
</tbody></table>`
            : '<p style="color:#999;font-size:12px">No glucose readings in this period.</p>';

        const mealsTable = meals.length > 0
            ? `<table><thead><tr><th>Date</th><th>Time</th><th>Type</th><th>Description</th><th>Carbs (g)</th></tr></thead><tbody>
${meals.map((m) => `<tr><td>${format(new Date(m.timestamp), 'MMM d, yyyy')}</td><td>${format(new Date(m.timestamp), 'h:mm a')}</td><td><span class="badge bb">${mealTypeLabels[m.mealType] || m.mealType}</span></td><td>${m.description || '—'}</td><td>${m.carbsEstimate ?? '—'}</td></tr>`).join('')}
</tbody></table>`
            : '<p style="color:#999;font-size:12px">No meals logged in this period.</p>';

        const activityTable = activities.length > 0
            ? `<table><thead><tr><th>Date</th><th>Time</th><th>Type</th><th>Intensity</th><th>Duration (min)</th></tr></thead><tbody>
${activities.map((a) => `<tr><td>${format(new Date(a.timestamp), 'MMM d, yyyy')}</td><td>${format(new Date(a.timestamp), 'h:mm a')}</td><td>${a.activityType || '—'}</td><td><span class="badge bp">${activityIntensityLabels[a.activityLevel] || a.activityLevel}</span></td><td>${a.durationMinutes ?? '—'}</td></tr>`).join('')}
</tbody></table>`
            : '<p style="color:#999;font-size:12px">No activities logged in this period.</p>';

        const moodTable = moodLogs.length > 0
            ? `<table><thead><tr><th>Date</th><th>Period</th><th>Mood</th><th>Note</th></tr></thead><tbody>
${moodLogs.map((m) => `<tr><td>${format(new Date(m.createdAt), 'MMM d, yyyy')}</td><td>${periodLabels[m.period] || m.period}</td><td>${moodEmojis[m.mood] || ''} ${m.mood}</td><td>${m.note || '—'}</td></tr>`).join('')}
</tbody></table>`
            : '<p style="color:#999;font-size:12px">No mood entries in this period.</p>';

        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Bluely Health Report – ${userName}</title><style>${css}</style></head><body>
<h1>Bluely Health Report</h1>
<p class="sub">Prepared for <strong>${userName}</strong> &middot; ${rangeLabel} &middot; Generated ${now}</p>
<h2>📊 Glucose Summary</h2>
<span class="pill">Target: ${targetMinDisplay}–${targetMaxDisplay} ${label}</span><span class="pill">${readings.length} readings</span>
<div class="stats">
  <div class="sb"><div class="sv">${glucoseAvg}</div><div class="sl">Avg (${label})</div></div>
  <div class="sb"><div class="sv green">${tir}%</div><div class="sl">Time in Range</div></div>
  <div class="sb"><div class="sv">${glucoseMin}</div><div class="sl">Minimum</div></div>
  <div class="sb"><div class="sv">${glucoseMax}</div><div class="sl">Maximum</div></div>
</div>${glucoseTable}
<h2>🍽️ Meals</h2>
<span class="pill">${meals.length} meals logged</span><span class="pill">Total carbs: ${totalCarbs}g</span>
${mealsTable}
<h2>🏃 Activity</h2>
<span class="pill">${activities.length} sessions</span><span class="pill">Total: ${totalActivityMins} minutes</span>
${activityTable}
<h2>💙 Mood &amp; Wellness</h2>
<span class="pill">${moodLogs.length} mood entries</span>
${moodTable}
<div class="footer"><p>Generated by Bluely &middot; Diabetes Self-Management Platform</p><p>This report is based on self-reported data and is not a substitute for professional medical advice.</p></div>
</body></html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const printWindow = window.open(url, '_blank');
        if (printWindow) printWindow.addEventListener('load', () => printWindow.print());
        setShowExportMenu(false);
    };

    // ─── Glucose renderers ────────────────────────────────────────────────────

    const renderGlucoseTableView = () => (
        <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="text-left px-4 py-3 font-semibold text-gray-600">Date &amp; Time</th>
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
                                    <span className={`text-lg font-bold ${getGlucoseColor(reading.value)}`}>{fmtGlucose(reading.value)}</span>
                                    <span className="text-xs text-gray-400 ml-1">{label}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getGlucoseBadge(reading.value)}`}>
                                        {getGlucoseLabel(reading.value)}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-600">{readingTypeLabels[reading.readingType] || reading.readingType}</td>
                                <td className="px-4 py-3 text-gray-500 text-xs max-w-40 truncate">{reading.mealContext || reading.activityContext || '—'}</td>
                                <td className="px-4 py-3 text-gray-500 text-xs">
                                    {reading.medicationTaken
                                        ? `${reading.medicationName || ''}${reading.medicationDose ? ` ${reading.medicationDose}${reading.medicationDoseUnit || ''}` : ''}`
                                        : '—'}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => handleDelete(reading._id)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
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

    const renderGlucoseCardView = () => (
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
                                            <div className={`text-2xl font-bold ${getGlucoseColor(reading.value)}`}>{fmtGlucose(reading.value)}</div>
                                            <div className="text-xs text-gray-500">{label}</div>
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${getGlucoseBadge(reading.value)}`}>
                                                    {getGlucoseLabel(reading.value)}
                                                </span>
                                                <span className="text-sm text-gray-600">{readingTypeLabels[reading.readingType] || reading.readingType}</span>
                                            </div>
                                            <div className="text-sm text-gray-500 mt-1">
                                                {format(new Date(reading.recordedAt), 'h:mm a')}
                                                {reading.mealContext && <span className="ml-2">• {reading.mealContext}</span>}
                                            </div>
                                            {reading.medicationTaken && reading.medicationName && (
                                                <div className="text-xs text-violet-600 mt-1 flex items-center gap-1">
                                                    <span className="inline-block w-2 h-2 rounded-full bg-violet-400" />
                                                    {reading.medicationName}
                                                    {reading.medicationDose && ` ${reading.medicationDose}${reading.medicationDoseUnit || ''}`}
                                                    {reading.injectionSite && ` · ${reading.injectionSite.replace(/_/g, ' ')}`}
                                                </div>
                                            )}
                                            {reading.notes && (
                                                <div className="text-sm text-gray-500 mt-1 italic">&quot;{reading.notes}&quot;</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-3 sm:mt-0">
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(reading._id)} className="text-gray-400 hover:text-red-600">
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

    // ─── Other tab renderers ──────────────────────────────────────────────────

    const renderMealsTab = () => {
        if (isLoadingOther) return <TabSkeleton />;
        if (meals.length === 0) return <EmptyState icon={<FiCoffee className="w-12 h-12" />} title="No meals logged" message="Log your meals to see them here." />;

        const grouped = meals.reduce((g, m) => {
            const d = format(new Date(m.timestamp), 'yyyy-MM-dd');
            if (!g[d]) g[d] = [];
            g[d].push(m);
            return g;
        }, {} as Record<string, MealEntry[]>);

        return (
            <div className="space-y-4">
                {Object.entries(grouped).map(([date, dayMeals]) => (
                    <Card key={date} className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                        <CardHeader>
                            <CardTitle className="flex items-center text-base">
                                <FiCalendar className="w-4 h-4 mr-2 text-gray-500" />
                                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                                <span className="ml-auto text-sm font-normal text-gray-500">{dayMeals.length} meal{dayMeals.length !== 1 ? 's' : ''}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {dayMeals.map((meal) => (
                                    <div key={meal._id} className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                                        <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                                            <FiCoffee className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                                                    {mealTypeLabels[meal.mealType] || meal.mealType}
                                                </span>
                                                {meal.carbsEstimate !== undefined && (
                                                    <span className="text-sm font-bold text-blue-700">{meal.carbsEstimate}g carbs</span>
                                                )}
                                            </div>
                                            {meal.description && <p className="text-sm text-gray-700 mt-0.5 truncate">{meal.description}</p>}
                                            <p className="text-xs text-gray-400 mt-0.5">{format(new Date(meal.timestamp), 'h:mm a')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    };

    const renderActivityTab = () => {
        if (isLoadingOther) return <TabSkeleton />;
        if (activities.length === 0) return <EmptyState icon={<FiActivity className="w-12 h-12" />} title="No activities logged" message="Log your exercise and activity to see it here." />;

        const grouped = activities.reduce((g, a) => {
            const d = format(new Date(a.timestamp), 'yyyy-MM-dd');
            if (!g[d]) g[d] = [];
            g[d].push(a);
            return g;
        }, {} as Record<string, ActivityEntry[]>);

        const intensityColors: Record<string, string> = {
            low: 'bg-green-50 border-green-100',
            medium: 'bg-amber-50 border-amber-100',
            high: 'bg-red-50 border-red-100',
        };
        const intensityBadge: Record<string, string> = {
            low: 'bg-green-100 text-green-700',
            medium: 'bg-amber-100 text-amber-700',
            high: 'bg-red-100 text-red-700',
        };

        return (
            <div className="space-y-4">
                {Object.entries(grouped).map(([date, dayActivities]) => (
                    <Card key={date} className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                        <CardHeader>
                            <CardTitle className="flex items-center text-base">
                                <FiCalendar className="w-4 h-4 mr-2 text-gray-500" />
                                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                                <span className="ml-auto text-sm font-normal text-gray-500">{dayActivities.length} session{dayActivities.length !== 1 ? 's' : ''}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {dayActivities.map((activity) => (
                                    <div key={activity._id} className={`flex items-center gap-3 p-3 rounded-lg border ${intensityColors[activity.activityLevel] || 'bg-gray-50 border-gray-100'}`}>
                                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 border border-gray-100">
                                            <FiActivity className="w-4 h-4 text-gray-600" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${intensityBadge[activity.activityLevel] || 'bg-gray-100 text-gray-700'}`}>
                                                    {activityIntensityLabels[activity.activityLevel] || activity.activityLevel}
                                                </span>
                                                {activity.activityType && <span className="text-sm text-gray-700 font-medium">{activity.activityType}</span>}
                                                {activity.durationMinutes && <span className="text-sm text-gray-500">{activity.durationMinutes} min</span>}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-0.5">{format(new Date(activity.timestamp), 'h:mm a')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    };

    const renderMoodTab = () => {
        if (isLoadingOther) return <TabSkeleton />;
        if (moodLogs.length === 0) return <EmptyState icon={<FiHeart className="w-12 h-12" />} title="No mood entries" message="Log your mood and wellness to see patterns here." />;

        const grouped = moodLogs.reduce((g, m) => {
            const d = format(new Date(m.createdAt), 'yyyy-MM-dd');
            if (!g[d]) g[d] = [];
            g[d].push(m);
            return g;
        }, {} as Record<string, MoodEntry[]>);

        const moodColors: Record<string, string> = {
            Great: 'bg-green-50 border-green-100',
            Good: 'bg-emerald-50 border-emerald-100',
            Okay: 'bg-blue-50 border-blue-100',
            Low: 'bg-amber-50 border-amber-100',
            Rough: 'bg-red-50 border-red-100',
        };

        return (
            <div className="space-y-4">
                {Object.entries(grouped).map(([date, dayMoods]) => (
                    <Card key={date} className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                        <CardHeader>
                            <CardTitle className="flex items-center text-base">
                                <FiCalendar className="w-4 h-4 mr-2 text-gray-500" />
                                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                                <span className="ml-auto text-sm font-normal text-gray-500">{dayMoods.length} entr{dayMoods.length !== 1 ? 'ies' : 'y'}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {dayMoods.map((entry) => (
                                    <div key={entry._id} className={`flex items-center gap-4 p-3 rounded-lg border ${moodColors[entry.mood] || 'bg-gray-50 border-gray-100'}`}>
                                        <span className="text-2xl">{moodEmojis[entry.mood] || '•'}</span>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-gray-800">{entry.mood}</span>
                                                <span className="text-xs text-gray-400">{periodLabels[entry.period] || entry.period}</span>
                                            </div>
                                            {entry.note && <p className="text-sm text-gray-600 mt-0.5 italic">{entry.note}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    };

    // ─── Tabs config ──────────────────────────────────────────────────────────
    const tabs: Array<{ id: HistoryTab; label: string; icon: React.ReactNode; count: number }> = [
        { id: 'glucose', label: 'Glucose', icon: <FiDroplet className="w-3.5 h-3.5" />, count: pagination?.total ?? readings.length },
        { id: 'meals', label: 'Meals', icon: <FiCoffee className="w-3.5 h-3.5" />, count: meals.length },
        { id: 'activity', label: 'Activity', icon: <FiActivity className="w-3.5 h-3.5" />, count: activities.length },
        { id: 'mood', label: 'Mood', icon: <FiHeart className="w-3.5 h-3.5" />, count: moodLogs.length },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Health History</h1>
                    <p className="text-gray-600 mt-1">View all your logged health data</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Date filter */}
                    <div className="flex items-center gap-2">
                        <FiFilter className="w-4 h-4 text-gray-500 shrink-0" />
                        <Select
                            options={dateRangeOptions}
                            value={dateRange}
                            onChange={(e) => { setDateRange(e.target.value); setCurrentPage(1); }}
                            className="w-full sm:w-40"
                        />
                    </div>

                    {/* Export button */}
                    <div className="relative" ref={exportRef}>
                        <Button type="button" variant="outline" size="sm" onClick={() => setShowExportMenu(!showExportMenu)}>
                            <FiShare2 className="w-4 h-4 mr-1" />
                            Export
                        </Button>
                        {showExportMenu && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                                <button onClick={exportCSV} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                                    <FiDownload className="w-4 h-4 text-green-600 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Download CSV</p>
                                        <p className="text-xs text-gray-500">Current tab data</p>
                                    </div>
                                </button>
                                <button onClick={exportFullReport} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-t border-gray-100">
                                    <FiFileText className="w-4 h-4 text-[#1F2F98] shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Full Report (PDF)</p>
                                        <p className="text-xs text-gray-500">All data — share with doctor</p>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center ${activeTab === tab.id ? 'bg-white text-[#1F2F98] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-[#1F2F98]/10 text-[#1F2F98]' : 'bg-gray-200 text-gray-500'}`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Glucose tab */}
            {activeTab === 'glucose' && (
                <>
                    {/* View toggle + count */}
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            {pagination
                                ? <>Showing <strong>{readings.length}</strong> of <strong>{pagination.total}</strong> readings</>
                                : null}
                        </p>
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
                    </div>
                    {isLoading ? (
                        <TabSkeleton />
                    ) : readings.length === 0 ? (
                        <EmptyState icon={<FiCalendar className="w-12 h-12" />} title="No readings found" message="Start tracking your blood glucose to see your history here." />
                    ) : (
                        <>
                            {viewMode === 'table' ? renderGlucoseTableView() : renderGlucoseCardView()}
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
                                    <span className="text-sm text-gray-600">Page {currentPage} of {pagination.pages}</span>
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
                </>
            )}

            {activeTab === 'meals' && renderMealsTab()}
            {activeTab === 'activity' && renderActivityTab()}
            {activeTab === 'mood' && renderMoodTab()}
        </div>
    );
}

// ─── Helper components ────────────────────────────────────────────────────────

function TabSkeleton() {
    return (
        <div className="space-y-3 animate-pulse">
            <div className="h-10 bg-gray-100 rounded-xl w-full" />
            {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl w-full" />)}
        </div>
    );
}

function EmptyState({ icon, title, message }: { icon: React.ReactNode; title: string; message: string }) {
    return (
        <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
            <CardContent className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
                    {icon}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600">{message}</p>
            </CardContent>
        </Card>
    );
}
