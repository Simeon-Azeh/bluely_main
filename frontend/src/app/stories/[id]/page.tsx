import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/landing';
import { stories } from '@/components/landing/storyData';

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const story = stories.find((item) => item.id === id);
    if (!story?.videoUrl) notFound();

    return (
        <div className="min-h-screen bg-[#122653] text-white">
            <Header />
            <main className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
                <Link href="/#stories" className="text-sm font-semibold text-[#c5d3ff] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">← All stories</Link>
                <p className="mt-12 text-xs font-bold tracking-[0.16em] text-[#b9cbff]">{story.category}</p>
                <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">{story.title}</h1>
                <video className="mt-9 aspect-video w-full bg-black" controls playsInline preload="metadata" poster={story.cover} aria-label={story.title}>
                    <source src={story.videoUrl} />
                    Your browser does not support video playback.
                </video>
            </main>
        </div>
    );
}
