import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/landing';
import { resources } from '@/components/landing/resourceData';

export function generateStaticParams() {
    return resources.map((resource) => ({ slug: resource.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const resource = resources.find((item) => item.slug === slug);
    return { title: resource ? `${resource.title} | Bluely` : 'Resource | Bluely', description: resource?.summary };
}

export default async function ResourceArticlePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const resource = resources.find((item) => item.slug === slug);
    if (!resource) notFound();

    return (
        <div className="min-h-screen bg-[#ffffff] text-[#172853]">
            <Header />
            <main className="mx-auto max-w-[1100px] px-5 pb-24 pt-12 sm:px-8 sm:pt-16 lg:px-10">
                <Link href="/resources" className="text-sm font-semibold text-[#1F2F98] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F2F98]">← All resources</Link>
                <header className="mt-14 max-w-[880px] border-b border-[#d9e1f1] pb-10">
                    <p className="text-xs font-bold tracking-[0.16em] text-[#1F2F98]">{resource.category} <span className="mx-2 text-[#91a0bf]" aria-hidden="true">·</span> {resource.readTime}</p>
                    <h1 className="mt-5 text-[clamp(2.7rem,5.4vw,5.5rem)] font-semibold leading-[1.08] tracking-[-0.055em]">{resource.title}</h1>
                    <p className="mt-6 max-w-[710px] text-lg leading-[1.75] text-[#52617e]">{resource.summary}</p>
                </header>
                <div className="grid gap-12 pt-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-20">
                    <article className="space-y-12">
                        {resource.sections.map((section) => <section key={section.heading}><h2 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">{section.heading}</h2><div className="mt-4 space-y-5 text-base leading-[1.9] text-[#42516e] sm:text-lg">{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></section>)}
                    </article>
                    <aside className="self-start border-t-[3px] border-[#1F2F98] bg-[#eef2fc] p-6 lg:sticky lg:top-28">
                        <h2 className="text-lg font-semibold">Keep learning</h2>
                        <p className="mt-3 text-sm leading-7 text-[#53617c]">This article is general education. For personal medical decisions, speak with your health care team.</p>
                        <p className="mt-7 text-xs font-bold tracking-[0.15em] text-[#1F2F98]">SOURCES</p>
                        <ul className="mt-3 space-y-3">{resource.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold leading-6 text-[#1F2F98] underline underline-offset-4 hover:text-[#172853] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F2F98]">{source.label} ↗</a></li>)}</ul>
                    </aside>
                </div>
            </main>
        </div>
    );
}
