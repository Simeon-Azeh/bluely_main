'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { FiArrowRight, FiPlus } from 'react-icons/fi';
import { format } from 'date-fns';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    ScatterChart,
    Scatter,
    ZAxis,
    Legend,
} from 'recharts';
import { useGlucoseUnit } from '@/hooks/useGlucoseUnit';
import { convertGlucose, type GlucoseUnit } from '@/lib/glucose';

interface IndividualReading {
    value: number;
    recordedAt: string;
    readingType?: string;
}

interface ChartDataPoint {
    date: string;
    fullDate: string;
    average: number;
    readings: number;
    rawReadings?: IndividualReading[];
}

interface WeeklyChartProps {
    chartData: ChartDataPoint[];
    targetMin: number;
    targetMax: number;
}

type ViewMode = 'daily' | 'readings';

const READING_TYPES = [
    { key: 'all', label: 'All', color: '#1F2F98' },
    { key: 'fasting', label: 'Fasting', color: '#6366f1' },
    { key: 'before_meal', label: 'Before Meal', color: '#f59e0b' },
    { key: 'after_meal', label: 'After Meal', color: '#ef4444' },
    { key: 'bedtime', label: 'Bedtime', color: '#8b5cf6' },
    { key: 'random', label: 'Random', color: '#10b981' },
] as const;

type ReadingTypeKey = (typeof READING_TYPES)[number]['key'];

function getTypeColor(type: string): string {
    return READING_TYPES.find(t => t.key === type)?.color ?? '#1F2F98';
}

function formatVal(val: unknown, unit: GlucoseUnit): string {
    const n = Number(val);
    if (isNaN(n)) return '—';
    return unit === 'mmol/L' ? n.toFixed(1) : Math.round(n).toString();
}

const CustomTooltip = ({
    active,
    payload,
    unit,
    viewMode,
}: {
    active?: boolean;
    payload?: Array<{ value: unknown; payload: { time?: string; date?: string; count?: number; typeLabel?: string } }>;
    label?: string;
    unit?: GlucoseUnit;
    viewMode?: ViewMode;
}) => {
    if (!active || !payload?.length) return null;
    const val = payload[0].value;
    const extra = payload[0].payload;
    return (
        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-lg border border-gray-100 dark:border-[#3a3a3a] p-3 min-w-[130px]">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {viewMode === 'readings' ? (extra.time ?? extra.date) : extra.date}
            </p>
            <p className="text-base font-bold text-[#1F2F98] dark:text-blue-300">
                {formatVal(val, unit ?? 'mg/dL')}{' '}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{unit}</span>
            </p>
            {viewMode === 'readings' && extra.typeLabel && (
                <p className="text-xs text-gray-400 mt-0.5 capitalize">{extra.typeLabel}</p>
            )}
            {viewMode === 'daily' && extra.count !== undefined && (
                <p className="text-xs text-gray-400 mt-0.5">{extra.count} reading{extra.count !== 1 ? 's' : ''}</p>
            )}
        </div>
    );
};

export default function WeeklyChart({ chartData, targetMin, targetMax }: WeeklyChartProps) {
    const { unit } = useGlucoseUnit();
    const [viewMode, setViewMode] = useState<ViewMode>('daily');
    const [typeFilter, setTypeFilter] = useState<ReadingTypeKey>('all');

    const convertedTargetMin = convertGlucose(targetMin, unit);
    const convertedTargetMax = convertGlucose(targetMax, unit);
    const yDomain: [number, number] = unit === 'mmol/L' ? [2.2, 16.7] : [40, 300];

    const dailyData = useMemo(() => chartData.map(d => ({
        date: d.date,
        value: convertGlucose(d.average, unit),
        count: d.rawReadings?.length ?? d.readings,
    })), [chartData, unit]);

    const allIndividual = useMemo(() => chartData.flatMap(d =>
        (d.rawReadings ?? []).map(r => {
            const dt = new Date(r.recordedAt);
            const typeKey = r.readingType ?? 'random';
            return {
                time: format(dt, 'EEE h:mm a'),
                date: format(dt, 'EEE'),
                timestamp: dt.getTime(),
                value: convertGlucose(r.value, unit),
                typeKey,
                typeLabel: READING_TYPES.find(t => t.key === typeKey)?.label ?? typeKey,
                fill: getTypeColor(typeKey),
            };
        })
    ).sort((a, b) => a.timestamp - b.timestamp), [chartData, unit]);

    const presentTypes = useMemo(() => {
        const keys = new Set(allIndividual.map(r => r.typeKey));
        return READING_TYPES.filter(t => t.key === 'all' || keys.has(t.key));
    }, [allIndividual]);

    const filteredIndividual = useMemo(() =>
        typeFilter === 'all' ? allIndividual : allIndividual.filter(r => r.typeKey === typeFilter),
        [allIndividual, typeFilter]);

    const scatterGroups = useMemo(() => {
        if (typeFilter !== 'all') {
            return [{ key: typeFilter, color: getTypeColor(typeFilter), data: filteredIndividual }];
        }
        return READING_TYPES.filter(t => t.key !== 'all').map(t => ({
            key: t.key,
            color: t.color,
            data: allIndividual.filter(r => r.typeKey === t.key),
        })).filter(g => g.data.length > 0);
    }, [typeFilter, allIndividual, filteredIndividual]);

    const hasData = chartData.length > 0;
    const hasIndividual = allIndividual.length > 0;

    return (
        <Card className="rounded-[20px] border border-[#e3e7f0] bg-white shadow-none dark:border-white/10 dark:bg-[#1a1a1a]">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5365b2] dark:text-[#aebdff]">Last 7 days</p>
                            <CardTitle>Glucose trend</CardTitle>
                        </div>
                    </div>
                    {hasData && <div className="flex items-center gap-2">
                        <div className="flex rounded-lg border border-gray-200 dark:border-[#3a3a3a] overflow-hidden text-xs">
                            <button
                                onClick={() => setViewMode('daily')}
                                className={`px-3 py-1.5 font-medium transition-colors ${viewMode === 'daily'
                                    ? 'bg-[#1F2F98] text-white'
                                    : 'bg-white text-gray-500 hover:bg-gray-50 dark:bg-[#1e1e1e] dark:text-gray-400 dark:hover:bg-[#2a2a2a]'
                                    }`}
                            >
                                Daily Avg
                            </button>
                            <button
                                onClick={() => setViewMode('readings')}
                                className={`px-3 py-1.5 font-medium transition-colors ${viewMode === 'readings'
                                    ? 'bg-[#1F2F98] text-white'
                                    : 'bg-white text-gray-500 hover:bg-gray-50 dark:bg-[#1e1e1e] dark:text-gray-400 dark:hover:bg-[#2a2a2a]'
                                    }`}
                            >
                                All Readings
                            </button>
                        </div>
                        <Link href="/insights" className="text-sm text-[#1F2F98] dark:text-blue-300 hover:underline font-medium flex items-center gap-1">
                            <FiArrowRight className="w-4 h-4" />
                        </Link>
                    </div>}
                </div>

                {viewMode === 'readings' && hasIndividual && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {presentTypes.map(t => (
                            <button
                                key={t.key}
                                onClick={() => setTypeFilter(t.key as ReadingTypeKey)}
                                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${typeFilter === t.key
                                    ? 'text-white border-transparent'
                                    : 'bg-white dark:bg-[#1e1e1e] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-[#3a3a3a] hover:border-gray-300'
                                    }`}
                                style={typeFilter === t.key ? { backgroundColor: t.color, borderColor: t.color } : {}}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                )}
            </CardHeader>

            <CardContent>
                {hasData ? (
                    <div className="h-72">
                        {viewMode === 'daily' ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dailyData}>
                                    <defs>
                                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1F2F98" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#1F2F98" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis
                                        stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false}
                                        domain={yDomain}
                                        tickFormatter={v => formatVal(v, unit)}
                                    />
                                    <Tooltip content={<CustomTooltip unit={unit} viewMode="daily" />} />
                                    <ReferenceLine y={convertedTargetMax} stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={1.5} />
                                    <ReferenceLine y={convertedTargetMin} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={1.5} />
                                    <Area
                                        type="monotone" dataKey="value"
                                        stroke="#1F2F98" strokeWidth={3}
                                        fill="url(#colorGradient)"
                                        dot={{ fill: '#1F2F98', strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, fill: '#1F2F98', stroke: '#fff', strokeWidth: 2 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : hasIndividual ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                    <XAxis
                                        dataKey="date" type="category"
                                        allowDuplicatedCategory={false}
                                        stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false}
                                    />
                                    <YAxis
                                        dataKey="value"
                                        stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false}
                                        domain={yDomain}
                                        tickFormatter={v => formatVal(v, unit)}
                                    />
                                    <ZAxis range={[45, 45]} />
                                    <Tooltip content={<CustomTooltip unit={unit} viewMode="readings" />} />
                                    <ReferenceLine y={convertedTargetMax} stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={1.5} />
                                    <ReferenceLine y={convertedTargetMin} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={1.5} />
                                    {scatterGroups.map(g => (
                                        <Scatter
                                            key={g.key}
                                            name={READING_TYPES.find(t => t.key === g.key)?.label ?? g.key}
                                            data={g.data}
                                            fill={g.color}
                                            fillOpacity={0.8}
                                            line={{ stroke: g.color, strokeWidth: 1, strokeOpacity: 0.2 }}
                                            lineType="joint"
                                            shape="circle"
                                        />
                                    ))}
                                    {typeFilter === 'all' && scatterGroups.length > 1 && (
                                        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                                    )}
                                </ScatterChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-sm text-gray-400">
                                No individual readings available
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex min-h-36 flex-col items-start justify-between gap-5 rounded-xl bg-[#f7f8fc] p-5 dark:bg-white/5 sm:flex-row sm:items-center sm:p-6">
                        <div><p className="font-semibold text-[#101b4b] dark:text-white">Your trend starts with a reading</p><p className="mt-1 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">As you log readings, this chart will show how they change across the week.</p></div>
                        <Link href="/glucose" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#1F2F98] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#17257d]"><FiPlus className="h-4 w-4" /> Log a reading</Link>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
