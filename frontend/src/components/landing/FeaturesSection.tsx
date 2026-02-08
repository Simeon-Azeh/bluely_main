'use client';

import { FiBarChart2, FiCoffee, FiCpu, FiBell, FiLock, FiGlobe } from 'react-icons/fi';

export default function FeaturesSection() {
    const features = [
        {
            icon: <FiBarChart2 className="w-6 h-6" />,
            title: 'Smart Glucose Tracking',
            description: 'Track readings and see trends, not just numbers.',
            color: 'bg-[#1F2F98]/10 text-[#1F2F98]',
        },
        {
            icon: <FiCoffee className="w-6 h-6" />,
            title: 'Meal & Carb Awareness',
            description: 'Log meals using familiar African foods with estimated carbs.',
            color: 'bg-orange-100 text-orange-600',
        },
        {
            icon: <FiCpu className="w-6 h-6" />,
            title: 'Simple Health Insights',
            description: 'Understand what your data is telling you — in plain language.',
            color: 'bg-purple-100 text-purple-600',
        },
        {
            icon: <FiBell className="w-6 h-6" />,
            title: 'Gentle Reminders',
            description: 'Prompts for readings, meals, and consistency.',
            color: 'bg-yellow-100 text-yellow-600',
        },
        {
            icon: <FiLock className="w-6 h-6" />,
            title: 'Private & Secure',
            description: 'Your health data stays yours.',
            color: 'bg-green-100 text-green-600',
        },
        {
            icon: <FiGlobe className="w-6 h-6" />,
            title: 'Built for Africa',
            description: 'Designed with local diets, access, and realities in mind.',
            color: 'bg-blue-100 text-blue-600',
        },
    ];

    return (
        <section id="features" className="py-20 lg:py-24 bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <span className="text-[#1F2F98] font-semibold text-sm uppercase tracking-wider">Features</span>
                    <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">
                        Everything you need to manage better
                    </h2>
                    <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                        Simple tools designed for real life, not clinical complexity.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#1F2F98]/20 hover:shadow-lg transition-all duration-300"
                        >
                            <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                {feature.icon}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                            <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
