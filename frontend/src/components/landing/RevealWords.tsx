'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import styles from './RevealWords.module.css';

type RevealWordsProps = {
    text: string;
    trigger?: 'load' | 'scroll';
    delay?: number;
};

export default function RevealWords({ text, trigger = 'scroll', delay = 0 }: RevealWordsProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const [visible, setVisible] = useState(false);
    const words = text.trim().split(/\s+/);

    useEffect(() => {
        if (trigger === 'load') {
            const timer = window.setTimeout(() => setVisible(true), 80);
            return () => window.clearTimeout(timer);
        }

        const element = ref.current;
        if (!element || !('IntersectionObserver' in window)) {
            const timer = window.setTimeout(() => setVisible(true), 0);
            return () => window.clearTimeout(timer);
        }

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setVisible(true);
                observer.disconnect();
            }
        }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });

        observer.observe(element);
        return () => observer.disconnect();
    }, [trigger]);

    return (
        <span ref={ref} className={styles.reveal} data-visible={visible}>
            <span className="sr-only">{text}</span>
            <span aria-hidden="true">
                {words.map((word, index) => (
                    <Fragment key={`${word}-${index}`}>
                        <span className={styles.word}>
                            <span className={styles.inner} style={{ transitionDelay: `${delay + Math.min(index * 48, 960)}ms` }}>{word}</span>
                        </span>
                        {index < words.length - 1 ? ' ' : null}
                    </Fragment>
                ))}
            </span>
        </span>
    );
}
