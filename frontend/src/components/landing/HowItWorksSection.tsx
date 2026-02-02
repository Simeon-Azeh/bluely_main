'use client';

import { FiDroplet, FiActivity, FiBarChart2, FiTarget } from 'react-icons/fi';

export default function HowItWorksSection() {
    return (
        <section className="py-20 lg:py-24 bg-blue-50/50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">How It Works</span>
                    <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">
                        Turning Daily Data into Practical Insights
                    </h2>
                    <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                        Bluely is designed to remain simple and accessible, ensuring that users can easily engage with the system without medical or technical expertise.
                    </p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <FeatureCard
                        icon={<FiDroplet className="w-7 h-7" />}
                        number="01"
                        title="Log Glucose Readings"
                        description="Record your blood glucose readings with context — what you ate, how you felt, and what you did."
                    />
                    <FeatureCard
                        icon={<FiActivity className="w-7 h-7" />}
                        number="02"
                        title="Capture Lifestyle Factors"
                        description="Capture daily lifestyle factors that influence glucose levels — meals, activity, stress, and more."
                    />
                    <FeatureCard
                        icon={<FiBarChart2 className="w-7 h-7" />}
                        number="03"
                        title="View Trends & Patterns"
                        description="View trends and patterns over time with clear, easy-to-understand visualizations."
                    />
                    <FeatureCard
                        icon={<FiTarget className="w-7 h-7" />}
                        number="04"
                        title="Get Personalized Insights"
                        description="Receive personalized insights that support better self-management decisions."
                    />
                </div>
            </div>
        </section>
    );
}

function FeatureCard({
    icon,
    number,
    title,
    description,
}: {
    icon: React.ReactNode;
    number: string;
    title: string;
    description: string;
}) {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-blue-100">
            <div className="text-xs font-bold text-blue-400 mb-4">{number}</div>
            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
        </div>
    );
}
