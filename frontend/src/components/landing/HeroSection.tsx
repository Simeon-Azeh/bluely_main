import Link from 'next/link';
import Image from 'next/image';
import ArrowCircle from './ArrowCircle';
import styles from './HeroSection.module.css';

const moments = [
    { src: 'bluely-teen-hero.png', alt: 'Young African person checking a glucose meter before a meal at home' },
    { src: 'story-reflection.png', alt: 'Young African woman reflecting beside a window' },
    { src: 'mission-community.png', alt: 'African young people talking together in a courtyard' },
    { src: 'story-school.png', alt: 'African teenagers walking together after school' },
    { src: 'mission-education.png', alt: 'Young people learning together from a booklet' },
    { src: 'mission-youth-voices.png', alt: 'Young African people in conversation outdoors' },
];

export default function HeroSection() {
    return (
        <section className={styles.hero} aria-labelledby="hero-heading">
            <div className={styles.layout}>
                <div>
                    <h1 id="hero-heading" className={styles.heading}>
                        Diabetes is part of their story.
                        <span>Not the whole story.</span>
                    </h1>
                    <p className={styles.description}>Bluely brings technology, education and community together to help young people living with diabetes understand their health, share their experiences and feel heard.</p>
                    <div className={styles.actions}>
                        <Link href="#meet-bluely" className={styles.primary}>Explore Bluely <ArrowCircle tone="blue" /></Link>
                        <Link href="/share-your-story" className={styles.secondary}>Share Your Story <span aria-hidden="true">↗</span></Link>
                    </div>
                    <div className={styles.foundation}><span>Built around young people.</span><span>Connected by lived experience.</span></div>
                </div>
                <div className={styles.visual}>
                    <div className={styles.mosaic}>
                        {moments.map((moment, index) => (
                            <div key={moment.src} className={`${styles.tile} ${styles[`tile${index}`]}`}>
                                <Image src={`/images/${moment.src}`} alt={moment.alt} fill priority={index === 0}
                                    sizes={index === 0 ? '(max-width: 600px) 62vw, (max-width: 1023px) 420px, 28vw' : '(max-width: 600px) 31vw, (max-width: 1023px) 210px, 14vw'} className={styles.photo} />
                                {index === 0 && <span className={styles.photoCaption}>Everyday life. Every part of you.</span>}
                            </div>
                        ))}
                    </div>
                    <div id="story" className={styles.story}>
                        <span className={styles.storyIcon} aria-hidden="true">“</span>
                        <div>
                            <p className={styles.storyLabel}>STORY SPACE</p>
                            <p className={styles.storyText}>A space to share more than your numbers.</p>
                            <p className={styles.storyNote}>Bluely&apos;s community vision</p>
                        </div>
                        <Link href="/share-your-story" className={styles.storyLink} aria-label="Explore Story Space and share your story">↗</Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
