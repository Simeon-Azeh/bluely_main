import Image from 'next/image';
import Link from 'next/link';
import { FiPlay } from 'react-icons/fi';
import type { Story } from './storyData';

export default function StoryVideoCard({ story, duplicate = false }: { story: Story; duplicate?: boolean }) {
    const content = (
        <>
            <Image src={story.cover} alt={duplicate ? '' : story.alt} fill sizes="(max-width: 640px) 72vw, 260px" className={`object-cover transition-transform duration-700 group-hover:scale-[1.035] motion-reduce:transform-none motion-reduce:transition-none ${story.objectPosition ?? 'object-center'}`} />
            <span className="absolute inset-0 bg-linear-to-t from-[#071735]/90 via-[#071735]/12 to-transparent" aria-hidden="true" />
            <span className="absolute left-5 top-5 text-xs font-bold tracking-[0.16em] text-white/90">STORY {story.id}</span>
            <span className="absolute bottom-5 left-5 right-5 text-white">
                <span className="block text-[11px] font-bold tracking-[0.15em] text-[#c4d3ff]">{story.category}</span>
                <span className="mt-2 block text-[1.35rem] font-semibold leading-tight tracking-[-0.025em] sm:text-2xl">{story.title}</span>
                <span className="mt-4 flex items-center gap-2.5 text-xs font-bold tracking-[0.08em] text-white/90">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/10"><FiPlay aria-hidden="true" className="ml-0.5 h-4 w-4" /></span>
                    {story.videoUrl ? 'WATCH STORY' : 'VIDEO COMING SOON'}
                </span>
            </span>
        </>
    );

    const className = `group relative block w-[240px] shrink-0 overflow-hidden bg-[#304674] sm:w-[270px] ${story.heightClass}`;

    // Placeholder cards stay noninteractive. Approved video URLs activate the dedicated story page.
    if (story.videoUrl && !duplicate) {
        return <Link href={`/stories/${story.id}`} className={`${className} focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white`} aria-label={`Watch ${story.title}`}>{content}</Link>;
    }

    return <article className={className} aria-label={duplicate ? undefined : `Sample story: ${story.title}. Video coming soon.`}>{content}</article>;
}
