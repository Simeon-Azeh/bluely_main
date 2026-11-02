'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import styles from './PhotoStory.module.css';

type Props = { src: string; alt: string; className?: string; priority?: boolean; sizes?: string };

export default function ParallaxPhoto({ src, alt, className = '', priority = false, sizes = '100vw' }: Props) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;
        const preference = window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 767px)');
        let frame = 0;
        let inView = false;
        const update = () => {
            frame = 0;
            if (preference.matches || !inView) return;
            const rect = element.getBoundingClientRect();
            const offset = Math.max(-36, Math.min(36, (window.innerHeight / 2 - rect.top - rect.height / 2) * .075));
            element.style.setProperty('--photo-offset', `${offset}px`);
        };
        const schedule = () => { if (!frame && inView && !preference.matches) frame = requestAnimationFrame(update); };
        const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; if (inView) schedule(); });
        observer.observe(element);
        const reset = () => { element.style.setProperty('--photo-offset', '0px'); schedule(); };
        preference.addEventListener('change', reset);
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);
        return () => { observer.disconnect(); cancelAnimationFrame(frame); preference.removeEventListener('change', reset); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
    }, []);

    return <div ref={ref} className={`${styles.photoFrame} ${className}`}><div className={styles.photoLayer}><Image src={src} alt={alt} fill priority={priority} sizes={sizes} className={styles.image} /></div></div>;
}
