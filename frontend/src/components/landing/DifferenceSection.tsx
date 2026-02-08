'use client';

import { FiBarChart2, FiGlobe, FiUsers, FiHeart } from 'react-icons/fi';

export default function DifferenceSection() {
    return (
        <section className="py-20 lg:py-24 bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Our Difference</span>
                    <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">
                        What Makes Bluely Different
                    </h2>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                    <DifferentiatorCard
                        icon={<FiBarChart2 className="w-6 h-6" />}
                        title="Multi-Factor Analytics Approach"
                        description="Bluely integrates multiple daily influences instead of isolating glucose readings. We look at the full picture of your daily life."
                    />
                    <DifferentiatorCard
                        icon={<FiGlobe className="w-6 h-6" />}
                        title="Designed for Low-Resource Settings"
                        description="Built with environments in mind where access to specialists, continuous monitoring, and structured diabetes education may be limited."
                    />
                    <DifferentiatorCard
                        icon={<FiUsers className="w-6 h-6" />}
                        title="User-Centered Simplicity"
                        description="Focused on clarity, usability, and actionable feedback rather than overwhelming medical complexity."
                    />
                    <DifferentiatorCard
                        icon={<FiHeart className="w-6 h-6" />}
                        title="Africa-First Design Philosophy"
                        description="Bluely is developed with African healthcare realities, infrastructure constraints, and user needs at its core."
                    />
                </div>
            </div>
        </section>
    );
}

function DifferentiatorCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all border border-blue-100 group hover:-translate-y-0.5">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-5 group-hover:scale-105 transition-transform">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
            <p className="text-gray-600 leading-relaxed">{description}</p>
        </div>
    );
}
