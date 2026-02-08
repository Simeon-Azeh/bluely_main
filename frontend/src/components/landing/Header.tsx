'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMobileMenuOpen]);

    const navLinks = [
        { href: '#about', label: 'About Bluely' },
        { href: '#how-it-works', label: 'How It Works' },
        { href: '#features', label: 'Features' },
        { href: '#vision', label: 'Vision' },
    ];

    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        e.preventDefault();
        const element = document.querySelector(href);
        if (element) {
            const offset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
        setIsMobileMenuOpen(false);
    };

    return (
        <>
            {/* Info Strip */}
            <div className="bg-[#1F2F98] text-white text-center py-2 px-4 text-sm hidden sm:block">
                <span className="opacity-90"> Bluely helps you understand your glucose patterns using everyday data.</span>
            </div>

            <header className={`bg-white sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'shadow-[0_4px_20px_rgba(0,0,0,0.06)]' : 'border-b border-gray-100'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 lg:h-18">
                        {/* Logo */}
                        <Link href="/" className="flex items-center group">
                            <Image
                                src="/icons/full_logotext.png"
                                alt="Bluely"
                                width={140}
                                height={42}
                                className="h-26 w-auto"
                            />
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center space-x-8">
                            {navLinks.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    onClick={(e) => scrollToSection(e, link.href)}
                                    className="text-gray-600 hover:text-[#1F2F98] font-medium transition-colors text-sm"
                                >
                                    {link.label}
                                </a>
                            ))}
                        </nav>

                        {/* Desktop Actions */}
                        <div className="hidden lg:flex items-center space-x-4">
                            <Link
                                href="/login"
                                className="text-gray-600 hover:text-[#1F2F98] font-medium transition-colors"
                            >
                                Log In
                            </Link>
                            <Link
                                href="/signup"
                                className="bg-[#1F2F98] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#1F2F98]/90 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.08)] shadow-[#1F2F98]/20"
                            >
                                Get Started
                            </Link>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? (
                                <FiX className="w-6 h-6 text-gray-700" />
                            ) : (
                                <FiMenu className="w-6 h-6 text-gray-700" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Drawer */}
                <div
                    className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                        }`}
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    {/* Drawer */}
                    <div
                        className={`absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
                            }`}
                    >
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <Image
                                src="/icons/full_logotext.png"
                                alt="Bluely"
                                width={120}
                                height={36}
                                className="h-8 w-auto"
                            />
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                aria-label="Close menu"
                            >
                                <FiX className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>

                        {/* Drawer Content */}
                        <div className="p-4">
                            <nav className="space-y-1">
                                {navLinks.map((link, index) => (
                                    <a
                                        key={link.href}
                                        href={link.href}
                                        onClick={(e) => scrollToSection(e, link.href)}
                                        className="block px-4 py-3 text-gray-700 hover:bg-[#1F2F98]/5 hover:text-[#1F2F98] rounded-xl font-medium transition-all"
                                        style={{
                                            animationDelay: `${index * 50}ms`,
                                            animation: isMobileMenuOpen ? 'slideIn 0.3s ease forwards' : 'none'
                                        }}
                                    >
                                        {link.label}
                                    </a>
                                ))}
                            </nav>

                            {/* Mobile Actions */}
                            <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                                <Link
                                    href="/login"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block w-full text-center px-4 py-3 text-gray-700 border border-gray-200 rounded-xl font-medium hover:border-[#1F2F98] hover:text-[#1F2F98] transition-all"
                                >
                                    Log In
                                </Link>
                                <Link
                                    href="/signup"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block w-full text-center px-4 py-3 bg-[#1F2F98] text-white rounded-xl font-semibold hover:bg-[#1F2F98]/90 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
                                >
                                    Get Started
                                </Link>
                            </div>

                            {/* Tagline */}
                            <div className="mt-8 p-4 bg-[#1F2F98]/5 rounded-xl">
                                <p className="text-sm text-gray-600 text-center">
                                     Diabetes self-management, made clear.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <style jsx>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>
        </>
    );
}
