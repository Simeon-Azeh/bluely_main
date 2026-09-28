import type { Metadata } from 'next';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import { Footer, Header } from '@/components/landing';

export const metadata: Metadata = {
    title: 'Privacy & Data Protection | Bluely',
    description: 'How Bluely handles account, health, community and communication data.',
};

const sections = [
    {
        number: '01', title: 'What we collect', children: <><p>We collect information you choose to provide when you create an account or use Bluely, including your name, email address, diabetes profile, glucose readings, meals, medications, activity, mood, lifestyle notes and preferences.</p><p>When you use a public form, we collect only what that form asks for. This includes story submissions, newsletter emails, contact messages and volunteer applications.</p></>,
    },
    {
        number: '02', title: 'Why we use it', children: <><p>We use account and health information to provide Bluely features, show your history, calculate summaries and generate observational predictions. We use public submission information to respond to your request, review your story, consider your volunteer application or send the updates you requested.</p><p>Bluely does not provide medical diagnosis, treatment or emergency care. Please speak with a qualified healthcare professional about medical decisions.</p></>,
    },
    {
        number: '03', title: 'Where it is stored', children: <><p>Authentication is managed through Firebase Authentication. Application and health data are stored in Firestore. The Node backend and ML service are hosted separately; the ML service receives prediction context for processing and stores patient personalization profiles in Firestore.</p><p>Our service providers may process data in locations outside your country. We use environment-managed credentials and encrypted HTTPS connections for service communication.</p></>,
    },
    {
        number: '04', title: 'Stories and community forms', children: <><p>Submitting a story does not automatically publish it. Our team reviews submissions and contacts the person before anything further happens. Contact and volunteer messages are reviewed by the Bluely team for the purpose described by each form.</p><p>Newsletter subscribers are stored so we can send the updates they requested. You can ask us to stop sending updates by contacting support@bluely.health.</p></>,
    },
    {
        number: '05', title: 'Your choices', children: <><p>You can review and update information through the app where those controls are available. You can request access, correction, deletion or restriction of your personal data by contacting privacy@bluely.health.</p><p>You can also ask us to stop community updates or follow up on a story, contact message or volunteer application.</p></>,
    },
    {
        number: '06', title: 'Children and young people', children: <><p>Bluely is built with young people in mind. Before public launch of story collection, we still need to define and implement an appropriate age and guardian consent policy for stories submitted by teenagers.</p><p>Do not submit urgent medical information through any public form.</p></>,
    },
];

export default function PrivacyPage() {
    return <div className="min-h-screen bg-[#f6f8ff] text-[#172853]"><Header /><main className="mx-auto max-w-360 px-5 pb-24 pt-10 sm:px-8 sm:pt-16 lg:px-10"><Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#1F2F98] hover:text-[#17257d] focus-visible:outline-2 focus-visible:outline-[#1F2F98]"><FiArrowLeft aria-hidden="true" /> Back to Bluely</Link><section className="mt-12 bg-[#132653] px-6 py-14 text-white sm:px-12 sm:py-20 lg:px-20 lg:py-24"><p className="text-xs font-bold tracking-[0.19em] text-[#b9cbff] sm:text-sm">A CLEARER PROMISE</p><h1 className="mt-5 max-w-190 text-[clamp(3rem,6vw,6.5rem)] font-semibold leading-[1] tracking-[-0.07em]">Your information deserves care.</h1><div className="mt-8 flex flex-col gap-6 border-t border-white/20 pt-6 text-sm leading-7 text-[#d6def2] sm:flex-row sm:justify-between sm:gap-12"><p>Privacy &amp; Data Protection</p><p>Last updated: September 28, 2026</p></div></section><section className="mt-8 bg-white px-6 py-10 sm:px-10 sm:py-14 lg:ml-[8%] lg:mr-[4%] lg:px-16 lg:py-16"><p className="max-w-190 text-lg leading-8 text-[#52617d] sm:text-xl">Bluely works with sensitive health information and personal stories. This policy explains what we collect, why we use it and the choices you have. We aim to be useful, honest and careful as the service grows.</p><div className="mt-14 border-t border-[#cbd5ed]">{sections.map((section) => <article key={section.number} className="grid gap-5 border-b border-[#dbe3f3] py-8 lg:grid-cols-[100px_minmax(0,1fr)] lg:gap-12"><p className="text-sm font-bold tracking-[0.14em] text-[#1F2F98]">{section.number}</p><div><h2 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">{section.title}</h2><div className="mt-4 max-w-180 space-y-4 text-base leading-7 text-[#52617d]">{section.children}</div></div></article>)}</div><div className="mt-12 border-t-2 border-[#1F2F98] pt-6"><p className="text-xs font-bold tracking-[0.16em] text-[#1F2F98]">TALK TO US</p><h2 className="mt-3 text-2xl font-semibold">Questions about your data?</h2><p className="mt-3 max-w-150 text-sm leading-7 text-[#52617d]">Email <a href="mailto:privacy@bluely.health" className="font-semibold text-[#1F2F98] underline underline-offset-4">privacy@bluely.health</a> for privacy requests or <a href="mailto:support@bluely.health" className="font-semibold text-[#1F2F98] underline underline-offset-4">support@bluely.health</a> for general help.</p></div></section></main><Footer /></div>;
}
