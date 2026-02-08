'use client';

import { FiEdit3, FiLayers, FiZap, FiTrendingUp } from 'react-icons/fi';

export default function HowItWorksSection() {
    const steps = [
        {
            icon: <FiEdit3 className="w-7 h-7" />,
            number: '01',
            title: 'Log simply',
            description: 'Track glucose readings, meals, and daily habits with minimal effort.',
            color: 'bg-[#1F2F98]',
        },
        {
            icon: <FiLayers className="w-7 h-7" />,
            number: '02',
            title: 'Build patterns',
            description: 'Bluely recommends at least 3 readings a day. With 21+ readings, we begin identifying meaningful trends.',
            color: 'bg-[#3B4CC0]',
        },
        {
            icon: <FiZap className="w-7 h-7" />,
            number: '03',
            title: 'Get clear insights',
            description: 'No medical jargon — just easy explanations like "Your morning readings are usually higher."',
            color: 'bg-[#5B6BD0]',
        },
        {
            icon: <FiTrendingUp className="w-7 h-7" />,
            number: '04',
            title: 'Improve gradually',
            description: 'Small, informed changes. Better control over time.',
            color: 'bg-[#7B8BE0]',
        },
    ];

    return (
        <section id="how-it-works" className="py-20 lg:py-24 bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <span className="text-[#1F2F98] font-semibold text-sm uppercase tracking-wider">How It Works</span>
                    <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">
                        Bluely turns daily logs into understanding
                    </h2>
                </div>

                <div className="relative">
                    {/* Connection Line - Desktop */}
                    <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-[#1F2F98] via-[#5B6BD0] to-[#7B8BE0]" />

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map((step, index) => (
                            <div key={index} className="relative">
                                <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all border border-gray-100 h-full">
                                    {/* Number Circle */}
                                    <div className={`w-14 h-14 ${step.color} text-white rounded-xl flex items-center justify-center mb-4 relative z-10`}>
                                        {step.icon}
                                    </div>

                                    <div className="text-xs font-bold text-[#1F2F98]/40 mb-2">STEP {step.number}</div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                                    <p className="text-gray-600 leading-relaxed">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Example Insights */}
                <div className="mt-16 bg-white rounded-2xl p-8 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                    <p className="text-sm font-semibold text-[#1F2F98] mb-4">Example insights you might see:</p>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                           
                            <p className="text-gray-700">&quot;Your morning readings are usually higher&quot;</p>
                        </div>
                        <div className="flex items-start gap-3">
                        
                            <p className="text-gray-700">&quot;This meal may be affecting your afternoon levels&quot;</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
