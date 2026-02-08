'use client';

import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';

export default function CTASection() {
    return (
        <section className="py-20 lg:py-24 bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                <div className="bg-gradient-to-br from-[#1F2F98] to-[#3B4CC0] rounded-3xl p-10 lg:p-16 shadow-2xl shadow-[#1F2F98]/20">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                        Take control of your diabetes — one clear step at a time.
                    </h2>
                    <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                        Join Bluely and start understanding your health, not guessing it.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/signup"
                            className="inline-flex items-center justify-center bg-white text-[#1F2F98] px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all shadow-lg hover:-translate-y-0.5"
                        >
                            Create an Account
                            <FiArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                        <Link
                            href="/login"
                            className="inline-flex items-center justify-center bg-white/10 text-white px-8 py-4 rounded-xl font-semibold text-lg border border-white/30 hover:bg-white/20 transition-all"
                        >
                            Log In
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
