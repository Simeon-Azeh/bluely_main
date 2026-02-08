'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
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
    };

    return (
        <footer className="bg-gray-900 text-gray-400">
            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                    {/* Brand Column */}
                    <div className="lg:col-span-2">
                        <Image
                            src="/icons/full_logotext_white.png"
                            alt="Bluely"
                            width={140}
                            height={42}
                            className="h-26 w-auto mb-4"
                        />
                        <p className="text-gray-400 leading-relaxed max-w-md">
                            Bluely helps people living with diabetes understand their daily habits and turn them into simple, actionable insights. Built for African realities.
                        </p>
                        <div className="mt-6 flex items-center gap-2">
                          
                            <span className="text-sm text-gray-500">Diabetes self-management for Africa</span>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-semibold text-white mb-4">Quick Links</h4>
                        <ul className="space-y-3">
                            <li>
                                <a
                                    href="#about"
                                    onClick={(e) => scrollToSection(e, '#about')}
                                    className="hover:text-white transition-colors"
                                >
                                    About Bluely
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#how-it-works"
                                    onClick={(e) => scrollToSection(e, '#how-it-works')}
                                    className="hover:text-white transition-colors"
                                >
                                    How It Works
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#features"
                                    onClick={(e) => scrollToSection(e, '#features')}
                                    className="hover:text-white transition-colors"
                                >
                                    Features
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#vision"
                                    onClick={(e) => scrollToSection(e, '#vision')}
                                    className="hover:text-white transition-colors"
                                >
                                    Our Vision
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Legal & Support */}
                    <div>
                        <h4 className="font-semibold text-white mb-4">Support</h4>
                        <ul className="space-y-3">
                            <li>
                                <Link href="#" className="hover:text-white transition-colors">
                                    Privacy & Data Protection
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-white transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-white transition-colors">
                                    Contact / Support
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-gray-500">
                            © {new Date().getFullYear()} Bluely — Diabetes self-management for Africa
                        </p>
                        <div className="flex items-center gap-6 text-sm">
                            <span className="text-gray-600">Made with 💙 in Cameroon</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
