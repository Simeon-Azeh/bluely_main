import type { Metadata } from 'next';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import { Footer, Header } from '@/components/landing';

export const metadata: Metadata = {
    title: 'Medical Disclaimer | Bluely',
    description: 'How to use Bluely education, tracking and pattern information alongside professional diabetes care.',
};

export default function MedicalDisclaimerPage() {
    return (
        <div className="min-h-screen bg-[#f6f8ff] text-[#172853]">
            <Header />
            <main className="mx-auto max-w-[980px] px-5 pb-24 pt-12 sm:px-8 sm:pb-28 sm:pt-16">
                <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#1F2F98] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F2F98]"><FiArrowLeft aria-hidden="true" /> Back to Bluely</Link>
                <p className="mt-14 text-xs font-bold tracking-[0.17em] text-[#1F2F98] sm:text-sm">HEALTH INFORMATION</p>
                <h1 className="mt-5 text-[clamp(2.8rem,6vw,5.7rem)] font-semibold leading-[1.08] tracking-[-0.06em]">Medical disclaimer</h1>
                <p className="mt-7 max-w-[790px] text-lg leading-[1.8] text-[#52617d] sm:text-xl">Bluely helps people record information, explore patterns and learn about diabetes. Its content and tools are for education and information. They do not replace care from a qualified healthcare professional.</p>

                <div className="mt-14 border-t border-[#b2bfdc]">
                    <section className="grid gap-4 border-b border-[#b2bfdc] py-8 sm:grid-cols-[190px_1fr] sm:gap-10">
                        <h2 className="text-xl font-semibold">Your care decisions</h2>
                        <p className="max-w-[670px] leading-[1.8] text-[#52617d]">Do not use Bluely content, glucose patterns, predictions or estimates to diagnose a condition, choose an insulin dose, change medication or make other treatment decisions. Speak with your healthcare professional about questions or changes to your diabetes care plan.</p>
                    </section>
                    <section className="grid gap-4 border-b border-[#b2bfdc] py-8 sm:grid-cols-[190px_1fr] sm:gap-10">
                        <h2 className="text-xl font-semibold">Information limits</h2>
                        <p className="max-w-[670px] leading-[1.8] text-[#52617d]">Insights depend on the information entered and may be incomplete or inaccurate. General resources cannot account for your personal medical history, circumstances or local care guidance. A healthcare professional can help you interpret information in your own context.</p>
                    </section>
                    <section className="grid gap-4 border-b border-[#b2bfdc] py-8 sm:grid-cols-[190px_1fr] sm:gap-10">
                        <h2 className="text-xl font-semibold">Urgent help</h2>
                        <p className="max-w-[670px] leading-[1.8] text-[#52617d]">Bluely is not an emergency service. If you think you or someone else has a medical emergency, contact your local emergency services or seek urgent medical care. Do not wait for a response from Bluely.</p>
                    </section>
                </div>
                <p className="mt-8 text-sm leading-[1.7] text-[#52617d]">This page explains how to use Bluely information. Please also read our <Link href="/terms" className="font-semibold text-[#1F2F98] underline underline-offset-4">Terms of Service</Link> and <Link href="/privacy" className="font-semibold text-[#1F2F98] underline underline-offset-4">Privacy Policy</Link>.</p>
            </main>
            <Footer />
        </div>
    );
}
