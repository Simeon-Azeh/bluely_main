import Link from 'next/link';
import ParallaxPhoto from './ParallaxPhoto';
import RevealWords from './RevealWords';
import styles from './PhotoStory.module.css';

export function StoryWave({ color = '#f6f8ff' }: { color?: string }) {
    return <svg className={styles.wave} viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true"><path fill={color} d="M0 44C240 110 430 2 720 35s490 78 720-14v69H0Z" /></svg>;
}

export default function PhotoStory({ chapter = 'daily' }: { chapter?: 'daily' | 'access' }) {
    const daily = chapter === 'daily';
    return (
        <section id={`life-${chapter}`} className={`${styles.chapter} ${daily ? '' : styles.access}`} aria-labelledby={`chapter-${chapter}`}>
            <div className={styles.chapterLayout}>
                <div className={styles.chapterCopy}>
                    <p className={styles.chapterNumber}>{daily ? '01 / THE EVERYDAY' : '02 / THE BIGGER PICTURE'}</p>
                    <h2 id={`chapter-${chapter}`}><RevealWords text={daily ? 'A small moment. A whole life around it.' : 'Care only works when people can reach it.'} /></h2>
                    <p>{daily ? 'A glucose check is just one moment in a day filled with plans, people and possibilities. Bluely brings understanding and support into that everyday life.' : 'Behind every prescription is a person trying to get on with life. Affordability, local pharmacies and community support all belong in the conversation.'}</p>
                    <Link href={daily ? '#meet-bluely' : '#support'} className={styles.chapterLink}>{daily ? 'Meet Bluely' : 'Help move the mission forward'} <span aria-hidden="true">↗</span></Link>
                </div>
                <figure className={styles.figure}>
                    <ParallaxPhoto src={daily ? '/images/real/woman-at-home.webp' : '/images/real/pharmacy.webp'} alt={daily ? 'A woman checking her glucose at a table at home' : 'A customer and a pharmacist talking across a pharmacy counter'} className={styles.chapterPhoto} sizes="(max-width: 767px) 100vw, 52vw" />
                    <figcaption>{daily ? 'Everyday care, beyond the screen.' : 'Access starts in the places people turn to for care.'}</figcaption>
                </figure>
            </div>
            <StoryWave color={daily ? '#f6f8ff' : '#1F2F98'} />
        </section>
    );
}
