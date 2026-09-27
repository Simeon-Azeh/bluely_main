import Link from 'next/link';
import { FiHeart } from 'react-icons/fi';

const footerGroups = [
    {
        title: 'EXPLORE',
        links: [
            { label: 'About', href: '/#more-than-an-app' },
            { label: 'What We Do', href: '/#future' },
            { label: 'Platform', href: '/#meet-bluely' },
            { label: 'Our Mission', href: '/#mission' },
        ],
    },
    {
        title: 'COMMUNITY',
        links: [
            { label: 'Stories', href: '/#stories' },
            { label: 'Resources', href: '/resources' },
            { label: 'Diabetes 101', href: '/resources/understanding-type-1-diabetes' },
            { label: 'For Families', href: '/resources/supporting-someone-with-t1d' },
        ],
    },
    {
        title: 'GET INVOLVED',
        links: [
            { label: 'Donate', href: '/#support' },
            { label: 'Partner With Us', href: '/#mission' },
            { label: 'Share Your Story', href: '/#share-your-story' },
            { label: 'Volunteer', href: 'mailto:support@bluely.health?subject=Volunteer%20with%20Bluely' },
        ],
    },
];

export default function Footer() {
    return (
        <footer className="bg-[#101d40] text-white">
            <div className="mx-auto max-w-[1440px] px-5 pt-20 sm:px-8 sm:pt-24 lg:px-10 lg:pt-28">
                <div className="grid gap-16 lg:grid-cols-[minmax(0,44fr)_minmax(0,56fr)] lg:gap-14">
                    <div>
                        <Link href="/" className="inline-block text-[clamp(3.7rem,7vw,7.5rem)] font-semibold leading-none tracking-[-0.08em] text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">BLUELY</Link>
                        <p className="mt-8 max-w-[490px] text-[clamp(1.65rem,2.4vw,2.6rem)] font-medium leading-[1.26] tracking-[-0.04em]">Living with diabetes is more than managing numbers.</p>
                        <p className="mt-5 max-w-[440px] text-base leading-[1.8] text-[#b7c4e1] sm:text-lg">We&apos;re building technology, community and understanding around the people behind them.</p>
                    </div>
                    <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 sm:gap-x-9 lg:pt-6">
                        {footerGroups.map((group) => (
                            <div key={group.title}>
                                <h2 className="text-xs font-bold tracking-[0.17em] text-[#9eb1e8]">{group.title}</h2>
                                <ul className="mt-6 space-y-4">
                                    {group.links.map((link) => <li key={link.label}><Link href={link.href} className="text-sm font-medium text-[#e2e8f7] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:text-base">{link.label}</Link></li>)}
                                </ul>
                            </div>
                        ))}
                    </nav>
                </div>

                <div className="mt-20 grid gap-4 border-t border-white/20 py-7 text-sm text-[#b7c4e1] sm:mt-24 lg:grid-cols-[minmax(0,44fr)_minmax(0,56fr)] lg:gap-14">
                    <p>Bluely offers education and information. It does not replace advice from your healthcare professional. <Link href="/medical-disclaimer" className="font-semibold text-white underline decoration-white/50 underline-offset-4 hover:decoration-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Read the medical disclaimer</Link>.</p>
                    <a href="mailto:support@bluely.health" className="font-semibold text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white lg:justify-self-end">Contact Bluely ↗</a>
                </div>
            </div>
            <div className="border-t border-white/20">
                <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-5 py-7 text-xs text-[#a9b9dc] sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
                    <p>© {new Date().getFullYear()} Bluely</p>
                    <div className="flex flex-wrap gap-x-6 gap-y-3">
                        <Link href="/privacy" className="hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Privacy</Link>
                        <Link href="/terms" className="hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Terms</Link>
                        <Link href="/medical-disclaimer" className="hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Medical Disclaimer</Link>
                    </div>
                    <p className="inline-flex items-center gap-1.5">Built for real life in Africa. <FiHeart aria-label="With care" className="h-3.5 w-3.5 text-[#b8c8ff]" /></p>
                </div>
            </div>
        </footer>
    );
}
