'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-400 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center mb-6 md:mb-0">
                        <Image
                            src="/icons/full_logotext_white.png"
                            alt="Bluely"
                            width={120}
                            height={35}
                            className="h-8 w-auto"
                        />
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
