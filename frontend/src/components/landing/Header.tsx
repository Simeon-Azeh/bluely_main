'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { FiArrowRight, FiChevronDown, FiExternalLink, FiHeart, FiLogIn, FiMenu, FiMonitor, FiX } from 'react-icons/fi';
import { FaApple, FaGooglePlay, FaTelegramPlane, FaWhatsapp } from 'react-icons/fa';
import ArrowCircle from './ArrowCircle';

const appLinks = [
    { href: '/login', label: 'Open the web app', description: 'Sign in to your Bluely account', icon: FiMonitor },
    { href: '/#meet-bluely', label: 'Explore the platform', description: 'See how Bluely brings daily data together', icon: FiArrowRight },
];

// Official store listings have not been published yet.
const storeLinks = [
    { label: 'Google Play', icon: FaGooglePlay },
    { label: 'Apple App Store', icon: FaApple },
];

const moreLinks = [
    { href: '/#meet-bluely', label: 'What We Do', description: 'How the platform helps' },
    { href: '/privacy', label: 'Privacy', description: 'How Bluely handles information' },
    { href: '/terms', label: 'Terms', description: 'Terms of use' },
];

// Bot destinations describe the planned channels until official launch URLs exist.
const botLinks = [
    { href: '/channels#telegram', label: 'Telegram bot', description: 'Bluely in apps you use · soon', icon: FaTelegramPlane },
    { href: '/channels#whatsapp', label: 'WhatsApp bot', description: 'Bluely in apps you use · soon', icon: FaWhatsapp },
];

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<'app' | 'more' | null>(null);
    const headerRef = useRef<HTMLElement>(null);
    const drawerRef = useRef<HTMLDivElement>(null);
    const drawerCloseRef = useRef<HTMLButtonElement>(null);
    const menuTriggerRef = useRef<HTMLButtonElement>(null);
    const wasDrawerOpen = useRef(false);

    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 12);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const desktop = window.matchMedia('(min-width: 1280px)');
        const onChange = () => { if (desktop.matches) setIsMobileMenuOpen(false); };
        desktop.addEventListener('change', onChange);
        return () => desktop.removeEventListener('change', onChange);
    }, []);

    useEffect(() => {
        document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isMobileMenuOpen]);

    useEffect(() => {
        if (isMobileMenuOpen) drawerCloseRef.current?.focus();
        else if (wasDrawerOpen.current) menuTriggerRef.current?.focus();
        wasDrawerOpen.current = isMobileMenuOpen;
    }, [isMobileMenuOpen]);

    useEffect(() => {
        if (!isMobileMenuOpen) return;
        const trapFocus = (event: KeyboardEvent) => {
            if (event.key !== 'Tab') return;
            const controls = Array.from(drawerRef.current?.querySelectorAll<HTMLElement>('a, button, summary') ?? []).filter((element) => element.getClientRects().length > 0);
            if (!controls.length) return;
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', trapFocus);
        return () => document.removeEventListener('keydown', trapFocus);
    }, [isMobileMenuOpen]);

    useEffect(() => {
        const onPointerDown = (event: PointerEvent) => {
            if (!headerRef.current?.contains(event.target as Node)) setOpenDropdown(null);
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpenDropdown(null);
                setIsMobileMenuOpen(false);
            }
        };
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, []);

    const closeMenus = () => {
        setOpenDropdown(null);
        setIsMobileMenuOpen(false);
    };

    return (
        <header ref={headerRef} className={`sticky top-0 z-[100] border-b bg-[#f6f8ff] text-[#182852] transition-[border-color,box-shadow,background-color] duration-300 dark:bg-[#f6f8ff] dark:text-[#182852] ${isScrolled ? 'border-[#dce4f5] bg-[#f6f8ff]/95 shadow-[0_12px_32px_rgba(18,36,77,0.09)]' : 'border-transparent'}`}>
            <div className="mx-auto flex h-[82px] max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
                <Link href="/" onClick={closeMenus} aria-label="Bluely home" className="shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F2F98]">
                    <Image src="/icons/full_logotext.png" alt="Bluely" width={146} height={44} className="h-auto w-[126px] xl:w-[146px]" priority />
                </Link>

                <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Main navigation">
                    <div className="relative">
                        <button type="button" aria-expanded={openDropdown === 'app'} aria-controls="app-dropdown" onClick={() => setOpenDropdown(openDropdown === 'app' ? null : 'app')} className="flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#26375f] transition-colors hover:bg-[#e9eefb] focus-visible:outline-2 focus-visible:outline-[#1F2F98]">
                            App <FiChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform duration-200 ${openDropdown === 'app' ? 'rotate-180' : ''}`} />
                        </button>
                        <div id="app-dropdown" className={`absolute left-0 top-full mt-3 max-h-[calc(100dvh-110px)] w-80 origin-top-left overflow-y-auto rounded-2xl border border-[#dce4f5] bg-[#ffffff] p-2 shadow-[0_22px_55px_rgba(18,36,77,0.16)] transition-[opacity,transform,visibility] duration-200 motion-reduce:transition-none ${openDropdown === 'app' ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-2 opacity-0'}`}>
                            <p className="px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-[0.13em] text-[#647396]">Bluely app</p>
                            {appLinks.map((item) => <Link key={item.href} href={item.href} onClick={closeMenus} className="group flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-[#eef2fc] focus-visible:outline-2 focus-visible:outline-[#1F2F98]"><span className="mt-0.5 rounded-lg bg-[#e7ecfa] p-2 text-[#1F2F98]"><item.icon aria-hidden="true" className="h-4 w-4" /></span><span><span className="block text-sm font-bold text-[#172853]">{item.label}</span><span className="mt-0.5 block text-xs leading-5 text-[#5b6a89]">{item.description}</span></span></Link>)}
                            <p className="px-3 pb-1 pt-3 text-xs font-bold uppercase tracking-[0.13em] text-[#647396]">Bluely in the apps you use</p>
                            {botLinks.map((item) => <Link key={item.label} href={item.href} onClick={closeMenus} className="group flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-[#eef2fc] focus-visible:outline-2 focus-visible:outline-[#1F2F98]"><span className="mt-0.5 rounded-lg bg-[#e7ecfa] p-2 text-[#1F2F98]"><item.icon aria-hidden="true" className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-[#172853]">{item.label}</span><span className="mt-0.5 block text-xs leading-5 text-[#5b6a89]">{item.description}</span></span><FiExternalLink aria-hidden="true" className="mt-1 h-3.5 w-3.5 text-[#6577a6]" /></Link>)}
                            <div className="mx-3 my-2 border-t border-[#e3e8f4]" />
                            {storeLinks.map((item) => <div key={item.label} className="flex items-center gap-3 px-3 py-2 text-[#647396]" aria-label={`${item.label} download coming soon`}><span className="rounded-lg bg-[#f0f3fa] p-2"><item.icon aria-hidden="true" className="h-4 w-4" /></span><span><span className="block text-sm font-semibold">{item.label}</span><span className="block text-xs">Download coming soon</span></span></div>)}
                        </div>
                    </div>
                    <Link href="/#more-than-an-app" className="rounded-lg px-2.5 py-2.5 text-sm font-semibold text-[#26375f] hover:bg-[#e9eefb] focus-visible:outline-2 focus-visible:outline-[#1F2F98]">About</Link>
                    <Link href="/#stories" className="rounded-lg px-2.5 py-2.5 text-sm font-semibold text-[#26375f] hover:bg-[#e9eefb] focus-visible:outline-2 focus-visible:outline-[#1F2F98]">Stories</Link>
                    <Link href="/#mission" className="rounded-lg px-2.5 py-2.5 text-sm font-semibold text-[#26375f] hover:bg-[#e9eefb] focus-visible:outline-2 focus-visible:outline-[#1F2F98]">Mission</Link>
                    <Link href="/resources" className="rounded-lg px-2.5 py-2.5 text-sm font-semibold text-[#26375f] hover:bg-[#e9eefb] focus-visible:outline-2 focus-visible:outline-[#1F2F98]">Resources</Link>
                    <div className="relative">
                        <button type="button" aria-expanded={openDropdown === 'more'} aria-controls="more-dropdown" onClick={() => setOpenDropdown(openDropdown === 'more' ? null : 'more')} className="flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#26375f] transition-colors hover:bg-[#e9eefb] focus-visible:outline-2 focus-visible:outline-[#1F2F98]">
                            More <FiChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform duration-200 ${openDropdown === 'more' ? 'rotate-180' : ''}`} />
                        </button>
                        <div id="more-dropdown" className={`absolute left-0 top-full mt-3 w-72 origin-top-left rounded-2xl border border-[#dce4f5] bg-[#ffffff] p-2 shadow-[0_22px_55px_rgba(18,36,77,0.16)] transition-[opacity,transform,visibility] duration-200 motion-reduce:transition-none ${openDropdown === 'more' ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-2 opacity-0'}`}>
                            {moreLinks.map((item) => <Link key={item.label} href={item.href} onClick={closeMenus} className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-[#eef2fc] focus-visible:outline-2 focus-visible:outline-[#1F2F98]"><span className="block text-sm font-bold text-[#172853]">{item.label}</span><span className="mt-0.5 block text-xs text-[#5b6a89]">{item.description}</span></Link>)}
                        </div>
                    </div>
                </nav>

                <div className="hidden items-center gap-2 xl:flex">
                    <Link href="/login" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-semibold text-[#344463] hover:text-[#1F2F98] focus-visible:outline-2 focus-visible:outline-[#1F2F98]"><FiLogIn aria-hidden="true" className="h-4 w-4" /> Sign In</Link>
                    <Link href="/#support" className="inline-flex items-center gap-1.5 rounded-full border border-[#1F2F98] px-3.5 py-2.5 text-sm font-bold text-[#1F2F98] transition-colors hover:bg-[#e9edfc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F2F98]"><FiHeart aria-hidden="true" className="h-4 w-4" /> Donate</Link>
                    <Link href="/signup" className="group inline-flex items-center gap-2 rounded-full bg-[#1F2F98] py-1.5 pl-4 pr-1.5 text-sm font-bold text-white transition-colors hover:bg-[#17257d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F2F98]">Get Started <ArrowCircle tone="blue" className="h-7 w-7" /></Link>
                </div>
                <button ref={menuTriggerRef} type="button" onClick={() => setIsMobileMenuOpen(true)} aria-label="Open menu" aria-expanded={isMobileMenuOpen} aria-controls="mobile-navigation" className="rounded-xl border border-[#dce4f5] bg-white/70 p-2.5 text-[#1F2F98] focus-visible:outline-2 focus-visible:outline-[#1F2F98] xl:hidden"><FiMenu className="h-5 w-5" /></button>
            </div>

            <div className={`fixed inset-0 z-[110] bg-[#0d1b44]/35 transition-[opacity,visibility] duration-300 motion-reduce:transition-none xl:hidden ${isMobileMenuOpen ? 'visible opacity-100' : 'invisible opacity-0'}`} onClick={closeMenus} aria-hidden="true" />
            <div ref={drawerRef} id="mobile-navigation" role="dialog" aria-label="Mobile navigation" aria-modal={isMobileMenuOpen} aria-hidden={!isMobileMenuOpen} className={`fixed inset-y-0 right-0 z-[120] flex h-dvh w-[min(92vw,420px)] flex-col border-l border-[#dce4f5] bg-[#f8faff] shadow-[-25px_0_65px_rgba(13,27,68,0.18)] transition-[transform,visibility] duration-300 ease-out motion-reduce:transition-none xl:hidden ${isMobileMenuOpen ? 'visible translate-x-0' : 'invisible translate-x-full'}`}>
                <div className="flex shrink-0 items-center justify-between border-b border-[#e2e8f6] px-5 py-5">
                    <Image src="/icons/full_logotext.png" alt="Bluely" width={130} height={40} />
                    <button ref={drawerCloseRef} type="button" onClick={closeMenus} aria-label="Close menu" className="rounded-xl border border-[#dce4f5] p-2.5 text-[#1F2F98] focus-visible:outline-2 focus-visible:outline-[#1F2F98]"><FiX className="h-5 w-5" /></button>
                </div>
                <nav aria-label="Mobile navigation" className={`min-h-0 flex-1 overflow-y-auto px-5 py-6 transition-[opacity,transform] delay-75 duration-300 motion-reduce:transition-none ${isMobileMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}>
                    <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#7481a1]">Explore Bluely</p>
                    <details className="group border-b border-[#e2e8f6]">
                        <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-base font-bold text-[#182852] focus-visible:outline-2 focus-visible:outline-[#1F2F98] [&::-webkit-details-marker]:hidden">App <FiChevronDown aria-hidden="true" className="h-5 w-5 transition-transform group-open:rotate-180" /></summary>
                        <div className="space-y-1 pb-3">{appLinks.map((item) => <Link key={item.href} href={item.href} onClick={closeMenus} className="block rounded-xl bg-[#eef2fc] px-4 py-3 text-[#172853]"><span className="block text-sm font-bold">{item.label}</span><span className="block text-xs text-[#5b6a89]">{item.description}</span></Link>)}<p className="px-2 pt-3 text-xs font-bold uppercase tracking-wider text-[#647396]">In the apps you use</p>{botLinks.map((item) => <Link key={item.href} href={item.href} onClick={closeMenus} className="flex items-center gap-3 rounded-xl bg-[#eef2fc] px-4 py-3 text-[#172853]"><item.icon aria-hidden="true" className="h-5 w-5 text-[#1F2F98]" /><span className="flex-1"><span className="block text-sm font-bold">{item.label}</span><span className="block text-xs text-[#5b6a89]">{item.description}</span></span><FiExternalLink aria-hidden="true" className="h-4 w-4 text-[#6577a6]" /></Link>)}{storeLinks.map((item) => <div key={item.label} className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-[#677799]"><item.icon aria-hidden="true" className="h-4 w-4" /><span className="text-sm font-semibold">{item.label}</span><span className="ml-auto text-xs">Coming soon</span></div>)}</div>
                    </details>
                    <Link href="/#more-than-an-app" onClick={closeMenus} className="block border-b border-[#e2e8f6] py-4 text-base font-bold text-[#182852]">About</Link>
                    <Link href="/#stories" onClick={closeMenus} className="block border-b border-[#e2e8f6] py-4 text-base font-bold text-[#182852]">Stories</Link>
                    <Link href="/#mission" onClick={closeMenus} className="block border-b border-[#e2e8f6] py-4 text-base font-bold text-[#182852]">Mission</Link>
                    <Link href="/resources" onClick={closeMenus} className="block border-b border-[#e2e8f6] py-4 text-base font-bold text-[#182852]">Resources</Link>
                    <details className="group border-b border-[#e2e8f6]">
                        <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-base font-bold text-[#182852] focus-visible:outline-2 focus-visible:outline-[#1F2F98] [&::-webkit-details-marker]:hidden">More <FiChevronDown aria-hidden="true" className="h-5 w-5 transition-transform group-open:rotate-180" /></summary>
                        <div className="space-y-1 pb-3">{moreLinks.map((item) => <Link key={item.label} href={item.href} onClick={closeMenus} className="block rounded-xl bg-[#eef2fc] px-4 py-3 text-[#172853]"><span className="block text-sm font-bold">{item.label}</span><span className="block text-xs text-[#5b6a89]">{item.description}</span></Link>)}</div>
                    </details>
                </nav>
                <div className={`shrink-0 space-y-3 border-t border-[#e2e8f6] bg-[#f8faff] px-5 py-5 transition-opacity delay-150 duration-300 motion-reduce:transition-none ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}>
                    <Link href="/login" onClick={closeMenus} className="flex items-center justify-center gap-2 rounded-xl border border-[#dce4f5] py-3 text-sm font-bold text-[#26375f]"><FiLogIn aria-hidden="true" /> Sign In</Link>
                    <div className="grid grid-cols-2 gap-3">
                        <Link href="/#support" onClick={closeMenus} className="flex items-center justify-center gap-2 rounded-xl border border-[#1F2F98] py-3 text-sm font-bold text-[#1F2F98]"><FiHeart aria-hidden="true" /> Donate</Link>
                        <Link href="/signup" onClick={closeMenus} className="group flex items-center justify-center gap-2 rounded-xl bg-[#1F2F98] py-2 text-sm font-bold text-white">Get Started <ArrowCircle tone="blue" className="h-7 w-7" /></Link>
                    </div>
                </div>
            </div>
        </header>
    );
}
