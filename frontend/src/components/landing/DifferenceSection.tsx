'use client';

import { FiEye, FiMapPin, FiMessageCircle, FiTrendingUp } from 'react-icons/fi';

export default function DifferenceSection() {
    const differences = [
        {
            icon: <FiEye className="w-6 h-6" />,
            title: 'Understanding, not just tracking',
            description: 'We focus on helping you understand your patterns, not just record numbers.',
        },
        {
            icon: <FiMapPin className="w-6 h-6" />,
            title: 'Local meals & routines',
            description: 'We design for local meals and daily routines familiar to African users.',
        },
        {
            icon: <FiMessageCircle className="w-6 h-6" />,
            title: 'Human language',
            description: 'We explain data in human language, not clinical charts.',
        },
        {
            icon: <FiTrendingUp className="w-6 h-6" />,
            title: 'Grows with you',
            description: 'We grow with the user — from basic logs to deeper insights.',
        },
    ];

    return (
        <section className="py-20 lg:py-24 bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left: Text */}
                    <div>
                        <span className="text-[#1F2F98] font-semibold text-sm uppercase tracking-wider">What Makes Us Different</span>
                        <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">
                            Bluely is not just another diabetes monitoring app.
                        </h2>

                        <div className="mt-8 space-y-6">
                            {differences.map((item, index) => (
                                <div key={index} className="flex gap-4">
                                    <div className="w-12 h-12 bg-[#1F2F98] rounded-xl flex items-center justify-center text-white flex-shrink-0">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                                        <p className="text-gray-600">{item.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Highlight Box */}
                    <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-xl shadow-gray-200/50 border border-gray-100">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-[#1F2F98]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <span className="text-4xl">🎯</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                Bluely meets you where you are
                            </h3>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                — and helps you move forward.
                            </p>

                            <div className="mt-8 pt-8 border-t border-gray-100">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-[#1F2F98]">21+</div>
                                        <div className="text-xs text-gray-500 mt-1">readings for insights</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-[#1F2F98]">3x</div>
                                        <div className="text-xs text-gray-500 mt-1">daily recommended</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-[#1F2F98]">1</div>
                                        <div className="text-xs text-gray-500 mt-1">app for everything</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
