'use client';

import { FiAlertCircle, FiHelpCircle, FiDollarSign, FiTrendingUp } from 'react-icons/fi';

export default function WhatIsBluelySection() {
    const problems = [
        {
            icon: <FiAlertCircle className="w-6 h-6" />,
            title: 'Overwhelming numbers',
            description: 'Glucose numbers feel overwhelming and hard to interpret',
        },
        {
            icon: <FiHelpCircle className="w-6 h-6" />,
            title: 'Missing context',
            description: 'Meals aren\'t labeled with carb information',
        },
        {
            icon: <FiDollarSign className="w-6 h-6" />,
            title: 'Foreign apps',
            description: 'Apps feel foreign, expensive, or designed for hospitals — not real life',
        },
        {
            icon: <FiTrendingUp className="w-6 h-6" />,
            title: 'No guidance',
            description: 'There\'s little guidance on what patterns actually mean',
        },
    ];

    return (
        <section id="about" className="py-20 lg:py-24 bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <span className="text-[#1F2F98] font-semibold text-sm uppercase tracking-wider">The Problem</span>
                    <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">
                        For many people living with diabetes
                    </h2>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {problems.map((problem, index) => (
                        <div
                            key={index}
                            className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-[#1F2F98]/20 transition-colors"
                        >
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-500 mb-4">
                                {problem.icon}
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">{problem.title}</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">{problem.description}</p>
                        </div>
                    ))}
                </div>

                <div className="text-center">
                    <div className="inline-block bg-[#1F2F98]/5 rounded-2xl px-8 py-4">
                        <p className="text-lg text-gray-700 font-medium">
                            Managing diabetes shouldn&apos;t require a medical degree.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
