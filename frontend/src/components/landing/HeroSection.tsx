import Link from 'next/link';
import ParallaxPhoto from './ParallaxPhoto';
import { StoryWave } from './PhotoStory';
import ArrowCircle from './ArrowCircle';
import styles from './HeroSection.module.css';

export default function HeroSection() {
    return (
        <section className={styles.hero} aria-labelledby="hero-heading">
            <div className={styles.background}><ParallaxPhoto src="/images/real/daily-care.webp" alt="A man checking his glucose while sitting at home" priority className="h-full" /></div>
            <div className={styles.overlay} aria-hidden="true" />
            <div className={styles.layout}>
                <div className={styles.copy}>
                    <h1 id="hero-heading" className={styles.heading}>
                        Diabetes is part of their story.
                        <span>Not the whole story.</span>
                    </h1>
                    <p className={styles.description}>Tools, knowledge and community for young people living with diabetes.</p>
                    <div className={styles.actions}>
                        <Link href="#meet-bluely" className={styles.primary}>Explore Bluely <ArrowCircle tone="white" /></Link>
                        <Link href="/share-your-story" className={styles.secondary}>Share Your Story <span aria-hidden="true">↗</span></Link>
                    </div>
                </div>
            </div>
            <StoryWave color="#f6f8ff" />
        </section>
    );
}
