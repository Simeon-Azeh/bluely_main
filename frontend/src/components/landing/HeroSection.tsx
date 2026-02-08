'use client';

import Link from 'next/link';
import { FiArrowRight, FiDroplet, FiPieChart, FiTrendingUp } from 'react-icons/fi';

export default function HeroSection() {
    return (
        <section className="relative overflow-hidden bg-gradient-to-b from-[#1F2F98]/5 via-white to-white py-16 lg:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left: Text Content */}
                    <div className="text-center lg:text-left">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
                            Diabetes management shouldn&apos;t feel{' '}
                            <span className="text-[#1F2F98]">confusing.</span>
                        </h1>

                        <p className="mt-6 text-xl text-gray-600 leading-relaxed">
                            Bluely helps people living with diabetes understand their daily habits — meals, glucose, and lifestyle — and turn them into simple, actionable insights.
                        </p>

                        <p className="mt-4 text-lg text-[#1F2F98] font-medium">
                            Built for African realities. Designed for everyday life.
                        </p>

                        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link
                                href="/signup"
                                className="inline-flex items-center justify-center bg-[#1F2F98] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[#1F2F98]/90 transition-all shadow-lg shadow-[#1F2F98]/20 hover:-translate-y-0.5"
                            >
                                Get Started
                                <FiArrowRight className="ml-2 w-5 h-5" />
                            </Link>
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg border border-gray-200 hover:border-[#1F2F98] hover:text-[#1F2F98] transition-all"
                            >
                                Log In
                            </Link>
                        </div>
                    </div>

                    {/* Right: Dashboard Mockup */}
                    <div className="relative">
                        <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 p-6 border border-gray-100">
                            {/* Dashboard Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-sm text-gray-500">Good morning</p>
                                    <h3 className="text-xl font-bold text-gray-900">Your Dashboard</h3>
                                </div>
                                <div className="w-10 h-10 bg-[#1F2F98]/10 rounded-full flex items-center justify-center">
                                    <span className="text-lg">👋</span>
                                </div>
                            </div>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                <div className="bg-[#1F2F98]/5 rounded-xl p-4">
                                    <FiDroplet className="w-5 h-5 text-[#1F2F98] mb-2" />
                                    <p className="text-2xl font-bold text-gray-900">112</p>
                                    <p className="text-xs text-gray-500">mg/dL avg</p>
                                </div>
                                <div className="bg-green-50 rounded-xl p-4">
                                    <FiPieChart className="w-5 h-5 text-green-600 mb-2" />
                                    <p className="text-2xl font-bold text-gray-900">78%</p>
                                    <p className="text-xs text-gray-500">In range</p>
                                </div>
                                <div className="bg-orange-50 rounded-xl p-4">
                                    <FiTrendingUp className="w-5 h-5 text-orange-500 mb-2" />
                                    <p className="text-2xl font-bold text-gray-900">5</p>
                                    <p className="text-xs text-gray-500">Day streak</p>
                                </div>
                            </div>

                            {/* Glucose Trend */}
                            <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm font-medium text-gray-700">Weekly Trend</p>
                                    <span className="text-xs text-green-600 font-medium">↓ 8% from last week</span>
                                </div>
                                <div className="flex items-end justify-between h-16 gap-2">
                                    {[65, 80, 55, 70, 85, 60, 75].map((height, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                            <div
                                                className="w-full bg-[#1F2F98]/20 rounded-t-sm transition-all hover:bg-[#1F2F98]/40"
                                                style={{ height: `${height}%` }}
                                            />
                                            <span className="text-[10px] text-gray-400">
                                                {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Insight Card */}
                            <div className="bg-gradient-to-r from-[#1F2F98] to-[#3B4CC0] rounded-xl p-4 text-white">
                                <p className="text-xs font-medium opacity-80 mb-1"> Insight</p>
                                <p className="text-sm">
                                    Your morning readings are usually higher. Consider checking before breakfast.
                                </p>
                            </div>
                        </div>

                        {/* Floating Elements */}
                        <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-lg p-3 border border-gray-100 hidden lg:block">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-sm">✓</span>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-900">Reading logged</p>
                                    <p className="text-[10px] text-gray-500">Just now</p>
                                </div>
                            </div>
                        </div>

                        <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-lg p-3 border border-gray-100 hidden lg:block">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-[#1F2F98]/10 rounded-full flex items-center justify-center">
                                    
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-900">Meal logged</p>
                                    <p className="text-[10px] text-gray-500">Lunch • 450 kcal</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
