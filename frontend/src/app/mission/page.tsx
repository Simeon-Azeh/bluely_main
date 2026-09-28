import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { GiAfrica } from 'react-icons/gi';
import { FiArrowRight } from 'react-icons/fi';
import { Footer, Header } from '@/components/landing';
import ArrowCircle from '@/components/landing/ArrowCircle';

export const metadata: Metadata = {
    title: 'Our Mission | Bluely',
    description: 'Bluely is working toward a future where young people living with diabetes across Africa have understanding, support and a community that listens.',
};

const commitments = [
    { number: '01', title: 'Make understanding possible', text: 'Turn complicated health information into clear, useful moments of understanding that help people ask better questions.' },
    { number: '02', title: 'Make room for real life', text: 'Build around meals, school, friendships, family, emotions and the everyday realities that numbers alone cannot explain.' },
    { number: '03', title: 'Make representation visible', text: 'Amplify young African voices living with diabetes so nobody has to wonder whether their experience belongs in the conversation.' },
    { number: '04', title: 'Make support feel closer', text: 'Connect people with tools, stories and community that remind them they are not managing in isolation.' },
];

export default function MissionPage() {
    return (
        <div className="min-h-screen bg-[#f6f8ff] text-[#172853]">
            <Header />
            <main>
                <section className="relative overflow-hidden bg-[#132653] py-20 text-white sm:py-28 lg:py-36">
                    <GiAfrica className="pointer-events-none absolute -right-24 top-1/2 hidden -translate-y-1/2 text-[min(62vw,840px)] leading-none text-[#aebfff]/8 lg:block" aria-hidden="true" />
                    <div className="relative mx-auto max-w-360 px-5 sm:px-8 lg:px-10">
                        <p className="text-xs font-bold tracking-[0.19em] text-[#b9cbff] sm:text-sm">THE BLUELY MISSION</p>
                        <h1 className="mt-6 max-w-205 text-[clamp(3.2rem,6.5vw,7rem)] font-semibold leading-[0.98] tracking-[-0.07em]">A future where every young person living with diabetes has a community that listens.</h1>
                        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,0.58fr)_minmax(0,0.42fr)] lg:items-end lg:gap-20">
                            <p className="max-w-145 text-lg leading-8 text-[#d6def2] sm:text-xl">We are building technology, education and connection around the person behind the glucose reading, with Africa at the centre of the conversation.</p>
                            <p className="border-l-2 border-[#8fa8ee] pl-5 text-sm leading-7 text-[#b9c7e7]">Understanding is not a luxury. Feeling seen is not an extra. Both belong in diabetes care.</p>
                        </div>
                    </div>
                </section>

                <section className="bg-[#eef2fc] py-20 sm:py-24 lg:py-32">
                    <div className="mx-auto grid max-w-360 gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.34fr)_minmax(0,0.66fr)] lg:gap-20 lg:px-10">
                        <div className="border-l-[3px] border-[#1F2F98] pl-5"><p className="text-xs font-bold tracking-[0.18em] text-[#1F2F98] sm:text-sm">THE WHY</p><p className="mt-5 max-w-62.5 text-sm leading-7 text-[#52617d]">Diabetes changes daily life. The support around it should understand that.</p></div>
                        <div><h2 className="max-w-190 text-[clamp(2.7rem,5vw,5.5rem)] font-semibold leading-[1.05] tracking-[-0.06em]">Behind every number is a person trying to live a full life.</h2><p className="mt-8 max-w-145 text-base leading-8 text-[#52617d] sm:text-lg">A diagnosis can bring questions, pressure and loneliness. It can also become part of a life filled with school, work, friendship, family, ambition and joy. Bluely exists to hold both truths at once.</p></div>
                    </div>
                </section>

                <section className="bg-white py-20 sm:py-24 lg:py-32" aria-labelledby="commitments-heading">
                    <div className="mx-auto max-w-360 px-5 sm:px-8 lg:px-10">
                        <div className="flex flex-col gap-6 border-b border-[#cbd5ed] pb-8 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold tracking-[0.18em] text-[#1F2F98] sm:text-sm">HOW WE SHOW UP</p><h2 id="commitments-heading" className="mt-4 max-w-170 text-[clamp(2.6rem,4.8vw,5rem)] font-semibold leading-[1.05] tracking-[-0.06em]">The work behind the promise.</h2></div><p className="max-w-82.5 text-sm leading-6 text-[#647396]">Four commitments keep the mission close to real people and real needs.</p></div>
                        <div className="mt-12 grid gap-x-10 gap-y-12 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">{commitments.map((commitment) => <article key={commitment.number} className="border-t border-[#9eadd1] pt-5"><p className="text-sm font-bold tracking-[0.12em] text-[#1F2F98]">{commitment.number}</p><h3 className="mt-8 text-2xl font-semibold leading-tight tracking-[-0.035em]">{commitment.title}</h3><p className="mt-4 text-sm leading-7 text-[#52617d]">{commitment.text}</p></article>)}</div>
                    </div>
                </section>

                <section className="overflow-hidden bg-[#172853] py-20 text-white sm:py-24 lg:py-32">
                    <div className="mx-auto grid max-w-360 gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,0.45fr)] lg:items-center lg:gap-20 lg:px-10">
                        <div className="relative min-h-90 overflow-hidden bg-[#263d76] sm:min-h-120"><Image src="/images/mission-education.png" alt="Young people learning together" fill sizes="(max-width: 1023px) 100vw, 52vw" className="object-cover opacity-85" /><div className="absolute inset-0 bg-linear-to-t from-[#172853]/75 via-transparent to-transparent" /><p className="absolute bottom-7 left-6 max-w-62.5 text-sm font-semibold leading-6 text-white sm:left-10">The mission grows through every conversation, question and story.</p></div>
                        <div><p className="text-xs font-bold tracking-[0.18em] text-[#aebfff] sm:text-sm">A SHARED FUTURE</p><h2 className="mt-5 max-w-155 text-[clamp(2.7rem,5vw,5.3rem)] font-semibold leading-[1.04] tracking-[-0.06em]">Understanding. Support. Community.</h2><p className="mt-7 max-w-130 text-base leading-8 text-[#d6def2] sm:text-lg">This is bigger than a product roadmap. It is a commitment to keep listening, keep learning and keep making space for the lives behind the data.</p><Link href="/about" className="group mt-8 inline-flex items-center gap-3 border-b border-[#b9cbff] pb-2 text-sm font-bold text-white hover:text-[#d6e0ff] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Meet the people building Bluely <FiArrowRight aria-hidden="true" /></Link></div>
                    </div>
                </section>

                <section className="bg-[#eef2fc] py-16 sm:py-20" aria-label="Get involved"><div className="mx-auto flex max-w-360 flex-col gap-7 px-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10"><div><p className="text-xs font-bold tracking-[0.18em] text-[#1F2F98]">BE PART OF THE MISSION</p><p className="mt-3 max-w-155 text-2xl font-semibold tracking-[-0.035em] text-[#26375f] sm:text-3xl">Every voice makes the work more honest.</p></div><div className="flex flex-wrap gap-5"><Link href="/share-your-story" className="group inline-flex min-h-12 items-center gap-3 rounded-full bg-[#1F2F98] px-5 py-2 text-sm font-bold text-white hover:bg-[#17257d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F2F98]">Share your story <ArrowCircle tone="blue" /></Link><Link href="/about" className="inline-flex min-h-12 items-center gap-2 border-b border-[#1F2F98] text-sm font-bold text-[#1F2F98] hover:text-[#17257d] focus-visible:outline-2 focus-visible:outline-[#1F2F98]">About Bluely <FiArrowRight aria-hidden="true" /></Link></div></div></section>
            </main>
            <Footer />
        </div>
    );
}
