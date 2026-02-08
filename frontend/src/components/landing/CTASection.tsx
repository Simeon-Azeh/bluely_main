'use client';

import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';

export default function CTASection() {
    return (
        <section className="py-20 lg:py-24 bg-blue-50/50">
            <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                    Take Control of Your Diabetes Journey
                </h2>
                <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                    Whether you are newly diagnosed or managing diabetes long-term, Bluely is designed to support smarter daily decisions.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/signup"
                        className="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
                    >
                        Create an Account
                        <FiArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg border border-gray-200 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm"
                    >
                        Log In
                    </Link>
                </div>
            </div>
        </section>
    );
}
