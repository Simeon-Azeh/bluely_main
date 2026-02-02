'use client';

export default function WhatIsBluelySection() {
    return (
        <section className="py-20 lg:py-24 bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">What Bluely Is</span>
                    <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">
                        More Than Monitoring. A Decision-Support Companion.
                    </h2>
                </div>
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <p className="text-lg text-gray-600 leading-relaxed">
                            Bluely is a digital diabetes self-management platform designed to help individuals move beyond simple data logging. While many tools focus only on recording blood glucose readings, Bluely integrates multiple daily factors to help users understand <strong className="text-gray-900">why</strong> their levels change, not just <strong className="text-gray-900">when</strong> they change.
                        </p>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            By combining blood glucose data with contextual inputs such as meals, activity, and personal routines, Bluely transforms raw health data into meaningful insights that support informed self-management decisions.
                        </p>
                    </div>
                    <div className="bg-blue-50 rounded-3xl p-8 lg:p-10">
                        <div className="grid grid-cols-2 gap-6">
                            <StatCard number="24/7" label="Data Tracking" />
                            <StatCard number="360°" label="Context Analysis" />
                            <StatCard number="100%" label="User Privacy" />
                            <StatCard number="∞" label="Insights" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function StatCard({ number, label }: { number: string; label: string }) {
    return (
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <div className="text-3xl font-bold text-blue-600 mb-1">{number}</div>
            <div className="text-sm text-gray-600 font-medium">{label}</div>
        </div>
    );
}
