import Image from 'next/image';
import Link from 'next/link';
import { FiArrowUpRight } from 'react-icons/fi';
import styles from './AffordabilitySection.module.css';

export default function AffordabilitySection() {
    return (
        <section className={styles.section} aria-labelledby="affordability-heading">
            <div className={styles.card}>
                <div className={styles.photos}>
                    <div className={styles.mainPhoto}><Image src="/images/real/community-care.webp" alt="A child receiving care from a health worker" fill sizes="(max-width: 767px) 90vw, 38vw" className={styles.image} /></div>
                    <div className={styles.insetPhoto}><Image src="/images/real/children-diabetes.webp" alt="Children checking glucose and receiving an injection" fill sizes="(max-width: 767px) 45vw, 20vw" className={styles.image} /></div>
                </div>
                <div className={styles.copy}>
                    <h2 id="affordability-heading">Help us make diabetes medications <span>more affordable in Africa.</span></h2>
                    <p className={styles.description}>A child&apos;s future should never depend on the price of insulin. Help us bring essential diabetes care within reach.</p>
                    <Link href="#support" className={styles.button}>See how you can help <FiArrowUpRight aria-hidden="true" /></Link>
                    <div className={styles.evidence}>
                        <p><strong>5.5 days&apos; pay</strong> for one month of insulin.</p>
                        <p className={styles.context}>A worker in Accra, Ghana — reported by WHO in 2019.</p>
                        <a className={styles.source} href="https://www.who.int/news-room/detail/13-11-2019-who-launches-first-ever-insulin-prequalification-programme-to-expand-access-to-life-saving-treatment-for-diabetes" target="_blank" rel="noopener noreferrer">Read the WHO report <FiArrowUpRight aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>
                    </div>
                </div>
            </div>
        </section>
    );
}
