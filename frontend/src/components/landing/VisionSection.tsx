'use client';

import { FiGlobe } from 'react-icons/fi';

export default function VisionSection() {
    return (
        <section className="py-20 lg:py-24 bg-blue-600 text-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 text-blue-100 text-sm font-medium mb-6">
                    <FiGlobe className="w-4 h-4 mr-2" />
                    Our Vision
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                    An Africa-First Vision for Digital Health
                </h2>
                <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed mb-8">
                    Bluely begins with a localized deployment in Cameroon, enabling close evaluation, feedback, and refinement. This focused approach ensures the system is contextually relevant and practically useful before broader expansion.
                </p>
                <div className="bg-white/10 rounded-2xl p-8 max-w-3xl mx-auto border border-white/20">
                    <p className="text-lg text-blue-50 leading-relaxed">
                        In the long term, Bluely aims to scale across African countries facing similar healthcare challenges, adapting to regional contexts while maintaining a shared mission: <strong className="text-white">empowering individuals to take control of their health through accessible digital decision-support tools.</strong>
                    </p>
                </div>
            </div>
        </section>
    );
}
