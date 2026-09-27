import Link from 'next/link';
import { FaTelegramPlane, FaWhatsapp } from 'react-icons/fa';
import type { Metadata } from 'next';
import { Header } from '@/components/landing';
import ArrowCircle from '@/components/landing/ArrowCircle';

export const metadata: Metadata = {
    title: 'Bluely in Telegram and WhatsApp | Bluely',
    description: 'Learn about the planned Bluely experiences in Telegram and WhatsApp, and use the Bluely web app today.',
};

const channels = [
    {
        id: 'telegram',
        name: 'Telegram',
        Icon: FaTelegramPlane,
        number: '01',
        description: 'A planned Bluely companion in Telegram: a familiar way to find education, community updates and a path back to your Bluely account.',
        subject: 'Notify me about Bluely on Telegram',
    },
    {
        id: 'whatsapp',
        name: 'WhatsApp',
        Icon: FaWhatsapp,
        number: '02',
        description: 'A planned Bluely companion in WhatsApp: a way to bring helpful information and the Bluely community closer to conversations already happening there.',
        subject: 'Notify me about Bluely on WhatsApp',
    },
];

export default function ChannelsPage() {
    return (
        <div className="min-h-screen bg-[#f6f8ff] text-[#172853]">
            <Header />
            <main>
                <section className="mx-auto max-w-[1280px] px-5 pb-16 pt-16 sm:px-8 sm:pt-20 lg:px-10 lg:pb-24">
                    <Link href="/" className="group inline-flex items-center gap-2 text-sm font-semibold text-[#1F2F98] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F2F98]"><ArrowCircle tone="text" direction="left" className="h-7 w-7 group-hover:-translate-x-1" /> Back to Bluely</Link>
                    <p className="mt-12 text-xs font-bold tracking-[0.17em] text-[#1F2F98] sm:text-sm">BLUELY, WHERE LIFE ALREADY HAPPENS</p>
                    <h1 className="mt-5 max-w-[900px] text-[clamp(2.8rem,6vw,5.6rem)] font-semibold leading-[1.08] tracking-[-0.055em]">Support that fits the apps young people already use.</h1>
                    <p className="mt-7 max-w-[700px] text-lg leading-[1.8] text-[#4f5e7b]">We&apos;re working toward Bluely experiences in Telegram and WhatsApp. These channels are upcoming; the bots are not live yet. The Bluely web app is available today.</p>
                    <Link href="/signup" className="group mt-8 inline-flex min-h-12 items-center gap-3 rounded-full bg-[#1F2F98] py-2 pl-6 pr-2 text-sm font-bold text-white hover:bg-[#17257d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F2F98]">Get Started with the web app <ArrowCircle tone="blue" /></Link>
                </section>
                <section aria-label="Planned messaging channels" className="bg-[#142856] py-16 text-white sm:py-20">
                    <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10">
                        {channels.map((channel) => (
                            <article id={channel.id} key={channel.id} className="grid scroll-mt-28 gap-6 border-t border-white/20 py-12 first:pt-0 lg:grid-cols-[minmax(0,32fr)_minmax(0,68fr)] lg:gap-12 lg:py-16">
                                <div className="flex items-start gap-5 text-[#bacaff]"><span className="text-sm font-bold tracking-wider">{channel.number}</span><channel.Icon aria-hidden="true" className="h-8 w-8" /></div>
                                <div>
                                    <p className="text-xs font-bold tracking-[0.16em] text-[#b9cbff]">UPCOMING CHANNEL</p>
                                    <h2 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Bluely on {channel.name}</h2>
                                    <p className="mt-5 max-w-[650px] text-base leading-[1.8] text-[#d6def2] sm:text-lg">{channel.description}</p>
                                    <a href={`mailto:support@bluely.health?subject=${encodeURIComponent(channel.subject)}`} className="group mt-7 inline-flex min-h-12 items-center gap-3 border-b border-[#b9cbff] text-sm font-semibold text-white hover:text-[#d6e0ff] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Ask to be notified <ArrowCircle tone="text" className="h-7 w-7" /></a>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
