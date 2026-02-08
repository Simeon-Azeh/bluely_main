'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
    return (
        <header className="bg-white/95 backdrop-blur-md border-b border-blue-50 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link href="/" className="flex items-center">
                        <Image
                            src="/icons/full_logotext.png"
                            alt="Bluely"
                            width={140}
                            height={42}
                            className="h-10 w-auto"
                        />
                    </Link>
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/login"
                            className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/signup"
                            className="bg-[#1F2F98] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#1F2F98]/90 transition-all shadow-sm shadow-blue-600/20"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}
