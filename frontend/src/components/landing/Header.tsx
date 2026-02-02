'use client';

import Link from 'next/link';
import { FiDroplet } from 'react-icons/fi';

export default function Header() {
    return (
        <header className="bg-white/95 backdrop-blur-md border-b border-blue-50 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm shadow-blue-600/20">
                            <FiDroplet className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-gray-900 tracking-tight">Bluely</span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/login"
                            className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/signup"
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/20"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}
