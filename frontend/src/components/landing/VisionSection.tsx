'use client';

import { FiGlobe, FiMap, FiDatabase, FiUsers, FiLink } from 'react-icons/fi';

export default function VisionSection() {
    const visionPoints = [
        {
            icon: <FiMap className="w-5 h-5" />,
            text: 'Support for multiple African countries',
        },
        {
            icon: <FiDatabase className="w-5 h-5" />,
            text: 'More localized food databases',
        },
        {
            icon: <FiUsers className="w-5 h-5" />,
            text: 'Language and cultural adaptation',
        },
        {
            icon: <FiLink className="w-5 h-5" />,
            text: 'Future integration with healthcare providers and educators',
        },
    ];

    return (
        <section id="vision" className="py-20 lg:py-24 bg-[#1F2F98] text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left: Map Illustration */}
                    <div className="relative">
                        <div className="bg-white/10 rounded-3xl p-8 border border-white/20 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    <FiGlobe className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm opacity-80">Starting in</p>
                                    <p className="font-bold text-xl">Cameroon 🇨🇲</p>
                                </div>
                            </div>

                            <div className="relative h-64 bg-white/5 rounded-2xl flex items-center justify-center">
                                <div className="text-center">
                                    <span className="text-6xl mb-4 block"></span>
                                    <p className="text-lg font-medium">Africa-First Deployment</p>
                                    <p className="text-sm opacity-70 mt-2">Scaling to serve the continent</p>
                                </div>

                                {/* Connection dots */}
                                <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                                <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-yellow-400 rounded-full animate-pulse delay-300" />
                                <div className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-500" />
                            </div>
                        </div>
                    </div>

                    {/* Right: Vision Text */}
                    <div>
                        <span className="text-blue-200 font-semibold text-sm uppercase tracking-wider">Our Vision</span>
                        <h2 className="mt-3 text-3xl sm:text-4xl font-bold">
                            Built locally. Scaling across Africa.
                        </h2>

                        <p className="mt-6 text-lg text-blue-100 leading-relaxed">
                            Bluely is starting with diabetes self-management, but our vision is bigger:
                        </p>

                        <div className="mt-8 space-y-4">
                            {visionPoints.map((point, index) => (
                                <div key={index} className="flex items-center gap-4 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                        {point.icon}
                                    </div>
                                    <p className="text-blue-50">{point.text}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 p-6 bg-white/10 rounded-2xl border border-white/20">
                            <p className="text-xl font-semibold text-center">
                                One platform. Many communities.<br />
                                <span className="text-blue-200">Better health outcomes.</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
