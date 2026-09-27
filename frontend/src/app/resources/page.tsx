import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/landing';
import ArrowCircle from '@/components/landing/ArrowCircle';
import { resources } from '@/components/landing/resourceData';

export const metadata: Metadata = {
    title: 'Learn with Bluely | Diabetes Resources',
    description: 'Clear educational resources about Type 1 diabetes, school life and supporting young people living with diabetes.',
};

export default function ResourcesPage() {
    return (
        <div className="min-h-screen bg-[#f6f8ff] text-[#172853]">
            <Header />
            <main className="mx-auto max-w-[1200px] px-5 pb-24 pt-16 sm:px-8 sm:pt-20 lg:px-10">
                <p className="text-xs font-bold tracking-[0.17em] text-[#1F2F98] sm:text-sm">LEARN WITH BLUELY</p>
                <h1 className="mt-5 max-w-[850px] text-[clamp(2.7rem,5.2vw,5.4rem)] font-semibold leading-[1.1] tracking-[-0.055em]">Understanding begins with good questions.</h1>
                <p className="mt-6 max-w-[680px] text-lg leading-[1.8] text-[#52617e]">Start with clear, source-linked introductions to diabetes and the everyday support young people need.</p>
                <div className="mt-16 border-t border-[#b8c5df]">
                    {resources.map((resource, index) => <Link key={resource.slug} href={`/resources/${resource.slug}`} className="group grid gap-5 border-b border-[#b8c5df] py-8 transition-colors hover:bg-[#eef2fc] focus-visible:outline-2 focus-visible:outline-[#1F2F98] sm:grid-cols-[70px_1fr_auto] sm:items-center sm:gap-7 sm:px-3"><span className="text-sm font-bold text-[#1F2F98]">0{index + 1}</span><span><span className="block text-xs font-bold tracking-[0.15em] text-[#1F2F98]">{resource.category}</span><span className="mt-2 block text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">{resource.title}</span><span className="mt-2 block max-w-[650px] text-sm leading-6 text-[#52617e]">{resource.summary}</span></span><span className="flex items-center gap-3 text-sm font-semibold text-[#52617e]">{resource.readTime}<ArrowCircle tone="white" /></span></Link>)}
                </div>
                <p className="mt-9 max-w-[760px] text-sm leading-7 text-[#62708a]">These articles are for general education. A local health professional can help with individual diagnosis, treatment and care plans.</p>
            </main>
        </div>
    );
}
