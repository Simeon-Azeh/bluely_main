'use client';

import Link from 'next/link';
import { FiGlobe, FiArrowRight } from 'react-icons/fi';

export default function HeroSection() {
    return (
        <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/50 to-white py-20 lg:py-28">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
                    <FiGlobe className="w-4 h-4 mr-2" />
                    Designed for African Healthcare Realities
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
                    Smarter Diabetes Self-Management,
                    <span className="block text-blue-600 mt-2">Designed for African Realities</span>
                </h1>
                <p className="mt-8 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                    Living with diabetes goes beyond tracking numbers. Bluely helps individuals understand how daily life — meals, activity, and habits — shapes blood glucose, empowering better decisions even where access to continuous clinical support is limited.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/signup"
                        className="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 hover:-translate-y-0.5"
                    >
                        Get Started
                        <FiArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg border border-gray-200 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        </section>
    );
}
