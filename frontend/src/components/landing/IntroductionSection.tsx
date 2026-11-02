import Image from 'next/image';
import styles from './IntroductionSection.module.css';

export default function IntroductionSection() {
    return (
        <section className={styles.section} aria-labelledby="introduction-heading">
            <div className={styles.container}>
                <div className={styles.picture}>
                    <Image src="/images/real/bluely-introduction.webp" alt="Bluely's founder, pictured alongside the words Meet Bluely. More than a diagnosis." fill sizes="(max-width: 767px) 90vw, (max-width: 1440px) 46vw, 620px" className={styles.thumbnail} />
                </div>
                <div className={styles.copy}>
                    <h2 id="introduction-heading">Meet Bluely.<br /><span>More than a diagnosis.</span></h2>
                    <p>We believe young people living with diabetes deserve to be understood, supported and heard.</p>
                    <p>Bluely brings everyday tools, clear education and community together to help make that possible.</p>
                </div>
            </div>
        </section>
    );
}
