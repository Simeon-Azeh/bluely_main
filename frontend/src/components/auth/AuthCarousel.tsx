'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './AuthCarousel.module.css';

type Slide = { title: string; description: string };

type AuthCarouselProps = {
    slides: Slide[];
    label: string;
};

export default function AuthCarousel({ slides, label }: AuthCarouselProps) {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const interval = window.setInterval(() => setCurrentSlide((slide) => (slide + 1) % slides.length), 6500);
        return () => window.clearInterval(interval);
    }, [slides.length]);

    return (
        <aside className="relative flex min-h-[290px] flex-col justify-between overflow-hidden bg-[#172853] px-6 pb-8 pt-7 text-white sm:min-h-[330px] sm:px-10 lg:min-h-screen lg:px-14 lg:pb-14 lg:pt-12">
            <div className="pointer-events-none absolute -right-28 -top-20 h-80 w-80 rounded-full border border-[#b9cbff]/20 sm:h-[420px] sm:w-[420px]" aria-hidden="true" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-1/2 w-full bg-linear-to-t from-[#0d1c44] to-transparent" aria-hidden="true" />
            <Link href="/" className="relative z-10 w-fit text-3xl font-semibold tracking-[-0.08em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:text-4xl">BLUELY</Link>
            <div className="relative z-10 max-w-[660px] pt-9 lg:pb-10">
                <div key={currentSlide} className={styles.slide}>
                    <h1 className="text-[clamp(2.25rem,4.8vw,5.5rem)] font-semibold leading-[1.05] tracking-[-0.06em]">{slides[currentSlide].title}</h1>
                    <p className="mt-4 max-w-[540px] text-sm leading-[1.7] text-[#d6def2] sm:mt-6 sm:text-lg">{slides[currentSlide].description}</p>
                </div>
                <div className="mt-7 flex items-center gap-2" role="group" aria-label={label}>
                    {slides.map((slide, index) => <button key={slide.title} type="button" onClick={() => setCurrentSlide(index)} aria-label={`Show message ${index + 1}`} aria-current={index === currentSlide ? 'true' : undefined} className={`h-2 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${index === currentSlide ? 'w-9 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'}`} />)}
                </div>
            </div>
        </aside>
    );
}
