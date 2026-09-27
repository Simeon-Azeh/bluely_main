'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiPause, FiPlay } from 'react-icons/fi';
import ArrowCircle from './ArrowCircle';
import StoryVideoCard from './StoryVideoCard';
import { stories } from './storyData';
import styles from './StoryCarousel.module.css';

export default function MissionSection() {
    const viewportRef = useRef<HTMLDivElement>(null);
    const [paused, setPaused] = useState(false);

    const scrollStories = (direction: -1 | 1) => {
        setPaused(true);
        viewportRef.current?.scrollBy({
            left: direction * 290,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        });
    };

    return (
        <section id="stories" aria-labelledby="stories-heading" className="overflow-hidden bg-[#132653] text-white">
            <div className="mx-auto grid max-w-[1440px] gap-6 px-5 pb-10 pt-20 sm:px-8 sm:pt-24 lg:grid-cols-[minmax(0,59fr)_minmax(0,41fr)] lg:items-end lg:gap-16 lg:px-10 lg:pb-12 lg:pt-28">
                <div>
                    <p className="text-xs font-bold tracking-[0.17em] text-[#b9cbff] sm:text-sm">BEYOND THE NUMBERS</p>
                    <h2 id="stories-heading" className="mt-5 max-w-[760px] text-[clamp(2.65rem,4.9vw,5.25rem)] font-semibold leading-[1.08] tracking-[-0.055em]">Every diagnosis has<br />a story behind it.</h2>
                </div>
                <div className="lg:pb-2">
                    <p className="max-w-[460px] text-base leading-[1.8] text-[#d6def2] sm:text-lg">Bluely is creating a space for young people living with diabetes to share their experiences, feel heard and remind others that they are not alone.</p>
                    <p className="mt-5 text-xs font-bold tracking-[0.15em] text-[#b9cbff]">SAMPLE STORY COVERS &nbsp; 01 — 06</p>
                </div>
            </div>

            <div className="relative pb-14 sm:pb-20">
                <div ref={viewportRef} role="region" tabIndex={0} aria-label="Sample Bluely stories. Scroll horizontally to browse." className={`${styles.viewport} ${paused ? styles.paused : ''} h-[490px] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#b9cbff] sm:h-[550px]`}>
                    <div className={styles.track}>
                        <div className="flex h-full shrink-0 items-end gap-4 pr-4 sm:gap-5 sm:pr-5">
                            {stories.map((story) => <StoryVideoCard key={story.id} story={story} />)}
                        </div>
                        <div aria-hidden="true" className="flex h-full shrink-0 items-end gap-4 pr-4 sm:gap-5 sm:pr-5">
                            {stories.map((story) => <StoryVideoCard key={`repeat-${story.id}`} story={story} duplicate />)}
                        </div>
                    </div>
                </div>
                <div className="mx-auto mt-6 flex max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
                    <p className="text-xs font-medium text-[#b9cbff]">Sample covers · films coming soon</p>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => scrollStories(-1)} aria-label="Scroll stories left" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><FiChevronLeft aria-hidden="true" /></button>
                        <button type="button" onClick={() => scrollStories(1)} aria-label="Scroll stories right" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><FiChevronRight aria-hidden="true" /></button>
                        <button type="button" onClick={() => setPaused(!paused)} aria-label={paused ? 'Resume automatic story movement' : 'Pause automatic story movement'} aria-pressed={paused} className="ml-1 flex h-10 w-10 items-center justify-center rounded-full border border-white/40 text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">{paused ? <FiPlay aria-hidden="true" /> : <FiPause aria-hidden="true" />}</button>
                    </div>
                </div>
            </div>

            <div id="mission" className="scroll-mt-20 bg-[#eef2fc] py-20 text-[#172853] sm:py-24 lg:py-28">
                <div className="mx-auto grid max-w-[1440px] gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,35fr)_minmax(0,65fr)] lg:gap-16 lg:px-10">
                    <div className="border-l-[3px] border-[#1F2F98] pl-5">
                        <p className="text-xs font-bold tracking-[0.17em] text-[#1F2F98] sm:text-sm">BUILD THE MISSION WITH US</p>
                        <p className="mt-4 max-w-[300px] text-base leading-[1.7] text-[#52617d]">These stories are why the mission matters.</p>
                    </div>
                    <div>
                        <h3 className="max-w-[780px] text-[clamp(2.4rem,4.4vw,4.8rem)] font-semibold leading-[1.12] tracking-[-0.052em]">Support a generation living <span className="text-[#1F2F98]">beyond the diagnosis.</span></h3>
                        <p className="mt-6 max-w-[660px] text-base leading-[1.8] text-[#475775] sm:text-lg">Partner with Bluely to strengthen diabetes education, youth advocacy, community support and access across Africa.</p>
                        <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
                            {/* Temporary partnership contact until a dedicated partner enquiry route exists. */}
                            <a href="mailto:support@bluely.health?subject=Partner%20with%20Bluely" className="group inline-flex min-h-13 items-center gap-4 rounded-full bg-[#1F2F98] py-2 pl-6 pr-2 text-sm font-bold text-white hover:bg-[#17257d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F2F98] sm:text-base">Become a Partner <ArrowCircle tone="blue" /></a>
                            <Link href="#vision" className="inline-flex min-h-12 items-center border-b border-[#1F2F98] text-sm font-semibold text-[#1F2F98] hover:text-[#17257d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F2F98] sm:text-base">Learn More</Link>
                        </div>
                        <div className="mt-11 border-t border-[#cbd5ed] pt-5">
                            <p className="text-xs font-bold tracking-[0.16em] text-[#1F2F98]">PARTNER WITH US</p>
                            <p className="mt-2 text-sm leading-7 text-[#52617d] sm:text-base">Schools <span aria-hidden="true">·</span> NGOs <span aria-hidden="true">·</span> Healthcare Organisations <span aria-hidden="true">·</span> Brands <span aria-hidden="true">·</span> Communities</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
