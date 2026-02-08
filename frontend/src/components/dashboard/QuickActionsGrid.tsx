'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui';
import { FiDroplet, FiActivity, FiHeart, FiSmile } from 'react-icons/fi';
import { IoFastFoodOutline } from 'react-icons/io5';

interface QuickAction {
    id: string;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    gradient: string;
    shadowColor: string;
}

const quickActions: QuickAction[] = [
    {
        id: 'glucose',
        label: 'Log Glucose',
        description: 'Track your blood sugar',
        icon: FiDroplet,
        href: '/glucose',
        gradient: 'from-[#1F2F98] to-[#3B4CC0]',
        shadowColor: 'shadow-[#1F2F98]/20',
    },
    {
        id: 'mood',
        label: 'Log Mood',
        description: 'How are you feeling?',
        icon: FiSmile,
        href: '/mood',
        gradient: 'from-pink-500 to-rose-500',
        shadowColor: 'shadow-pink-500/20',
    },
    {
        id: 'meal',
        label: 'Log Meal',
        description: 'What did you eat?',
        icon: IoFastFoodOutline,
        href: '/meals',
        gradient: 'from-orange-500 to-amber-500',
        shadowColor: 'shadow-orange-500/20',
    },
    {
        id: 'activity',
        label: 'Log Activity',
        description: 'Track your exercise',
        icon: FiActivity,
        href: '/activity',
        gradient: 'from-green-500 to-emerald-500',
        shadowColor: 'shadow-green-500/20',
    },
];

export default function QuickActionsGrid() {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                    <Link key={action.id} href={action.href}>
                        <Card className="border-0 shadow-lg shadow-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
                            <CardContent className="p-4">
                                <div className="flex flex-col items-center text-center">
                                    <div className={`w-14 h-14 bg-gradient-to-br ${action.gradient} rounded-2xl flex items-center justify-center shadow-lg ${action.shadowColor} mb-3`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-1">{action.label}</h3>
                                    <p className="text-xs text-gray-500">{action.description}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                );
            })}
        </div>
    );
}
