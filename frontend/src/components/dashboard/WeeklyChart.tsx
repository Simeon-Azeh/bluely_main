'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { FiBarChart2, FiArrowRight, FiPlus } from 'react-icons/fi';
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
} from 'recharts';

interface ChartDataPoint {
    date: string;
    fullDate: string;
    average: number;
    readings: number;
}

interface WeeklyChartProps {
    chartData: ChartDataPoint[];
    targetMin: number;
    targetMax: number;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3">
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-lg font-bold text-[#1F2F98]">
                    {payload[0].value} <span className="text-sm font-normal text-gray-500">mg/dL</span>
                </p>
            </div>
        );
    }
    return null;
};

export default function WeeklyChart({ chartData, targetMin, targetMax }: WeeklyChartProps) {
    return (
        <Card className="border-0 shadow-lg shadow-gray-100">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                            <FiBarChart2 className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <CardTitle>Weekly Trend</CardTitle>
                            <p className="text-sm text-gray-500">Last 7 days average</p>
                        </div>
                    </div>
                    <Link href="/insights" className="text-sm text-[#1F2F98] hover:underline font-medium flex items-center gap-1">
                        View Insights
                        <FiArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </CardHeader>
            <CardContent>
                {chartData.length > 0 ? (
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1F2F98" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#1F2F98" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#9ca3af"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#9ca3af"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={[40, 300]}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <ReferenceLine
                                    y={targetMax}
                                    stroke="#f59e0b"
                                    strokeDasharray="5 5"
                                    strokeWidth={1.5}
                                />
                                <ReferenceLine
                                    y={targetMin}
                                    stroke="#ef4444"
                                    strokeDasharray="5 5"
                                    strokeWidth={1.5}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="average"
                                    stroke="#1F2F98"
                                    strokeWidth={3}
                                    fill="url(#colorGradient)"
                                    dot={{ fill: '#1F2F98', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, fill: '#1F2F98', stroke: '#fff', strokeWidth: 2 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-72 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <FiBarChart2 className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-600 font-medium mb-2">No data yet</p>
                            <p className="text-sm text-gray-500 mb-4">Start logging to see your trends</p>
                            <Link href="/glucose">
                                <Button size="sm" className="bg-[#1F2F98]">
                                    <FiPlus className="w-4 h-4 mr-1" />
                                    Log First Reading
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
