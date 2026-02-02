'use client';

import Link from 'next/link';
import { FiDroplet } from 'react-icons/fi';

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-400 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center space-x-3 mb-6 md:mb-0">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                            <FiDroplet className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">Bluely</span>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-sm">
                        <span>© 2026 Bluely</span>
                        <span className="hidden md:inline">|</span>
                        <span>Academic Project | Digital Health Innovation</span>
                        <span className="hidden md:inline">|</span>
                        <div className="flex gap-4">
                            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
                            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
