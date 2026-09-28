import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { GiAfrica } from 'react-icons/gi';
import { FiArrowRight } from 'react-icons/fi';
import { Footer, Header } from '@/components/landing';
import ArrowCircle from '@/components/landing/ArrowCircle';

export const metadata: Metadata = {
    title: 'About Bluely | Beyond the Numbers',
    description: 'Learn why Bluely exists and how we are building technology, understanding and community around young people living with diabetes in Africa.',
};

const pillars = [
    { number: '01', title: 'Understand', description: 'Clear, useful tools that make diabetes data easier to read and everyday questions easier to ask.' },
    { number: '02', title: 'Connect', description: 'Stories and community that make room for the emotional side of living with diabetes.' },
    { number: '03', title: 'Amplify', description: 'A platform for young African voices to be represented, heard and taken seriously.' },
];

const teamMembers: Array<{ name: string; role: string; bio: string; image?: string }> = [
    {
        name: 'Simeon Azeh',
        role: 'FOUNDER',
        bio: 'A developer living with Type 1 diabetes who dared to dream and build something he genuinely needs: a more human way to understand the numbers and the life around them.',
    },
    {
        name: 'Foncham Randolf',
        role: 'CHIEF TECHNOLOGY OFFICER',
        bio: 'A recent medical laboratory science graduate who cares deeply about solving diabetes challenges and bringing thoughtful health technology closer to the people it is meant to serve.',
    },
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#f6f8ff] text-[#172853]">
            <Header />
            <main>
                <section className="overflow-hidden bg-[#132653] text-white">
                    <div className="mx-auto grid max-w-360 items-stretch px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.86fr)] lg:px-10">
                        <div className="relative py-20 sm:py-28 lg:py-36">
                            <div className="absolute -left-24 top-16 h-64 w-64 rounded-full border border-[#aebfff]/15" aria-hidden="true" />
                            <div className="relative z-10 max-w-190">
                                <p className="text-xs font-bold tracking-[0.19em] text-[#b9cbff] sm:text-sm">ABOUT BLUELY</p>
                                <h1 className="mt-6 max-w-180 text-[clamp(3.4rem,6.8vw,7.2rem)] font-semibold leading-[0.98] tracking-[-0.07em]">Diabetes is part of someone&apos;s story. It is never the whole story.</h1>
                                <p className="mt-8 max-w-142.5 text-base leading-8 text-[#d6def2] sm:text-lg">Bluely brings technology, education and community together for young people living with diabetes across Africa.</p>
                                <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-5">
                                    <Link href="/mission" className="group inline-flex min-h-13 items-center gap-4 rounded-full bg-white py-2 pl-6 pr-2 text-sm font-bold text-[#1F2F98] transition-colors hover:bg-[#e9edfc] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:text-base">See the mission <ArrowCircle tone="white" /></Link>
                                    <span className="text-xs font-bold tracking-[0.17em] text-[#aebfff]">BUILT FOR REAL LIFE IN AFRICA</span>
                                </div>
                            </div>
                        </div>
                        <div className="relative min-h-90 overflow-hidden sm:min-h-120 lg:min-h-0">
                            <Image src="/images/mission-community.png" alt="Young African people spending time together in a community space" fill sizes="(max-width: 1023px) 100vw, 43vw" className="object-cover object-center opacity-75" priority />
                            <div className="absolute inset-0 bg-linear-to-r from-[#132653] via-[#132653]/25 to-transparent" />
                            <div className="absolute inset-0 bg-linear-to-t from-[#132653]/65 via-transparent to-[#132653]/10" />
                            <p className="absolute bottom-8 left-6 max-w-62.5 text-sm font-semibold leading-6 text-white sm:left-10 sm:bottom-10">The person behind the number is where the work begins.</p>
                        </div>
                    </div>
                </section>

                <section className="bg-[#eef2fc] py-20 sm:py-24 lg:py-32">
                    <div className="mx-auto grid max-w-360 gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.36fr)_minmax(0,0.64fr)] lg:gap-20 lg:px-10">
                        <div className="border-l-[3px] border-[#1F2F98] pl-5">
                            <p className="text-xs font-bold tracking-[0.18em] text-[#1F2F98] sm:text-sm">WHY WE EXIST</p>
                            <p className="mt-5 max-w-62.5 text-sm leading-7 text-[#52617d]">Because managing diabetes is daily life, not just a medical event.</p>
                        </div>
                        <div>
                            <h2 className="max-w-225 text-[clamp(2.6rem,5vw,5.7rem)] font-semibold leading-[1.05] tracking-[-0.06em]">Technology helps us understand the numbers. <span className="text-[#1F2F98]">People give them meaning.</span></h2>
                            <div className="mt-8 grid gap-6 text-base leading-8 text-[#52617d] sm:grid-cols-2 sm:gap-10 sm:text-lg">
                                <p>Young people living with diabetes deserve tools that respect their context, their culture and the full lives they are building around care.</p>
                                <p>Bluely is a space to learn what patterns might mean, share what life feels like and find reminders that nobody has to make sense of it alone.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-white py-20 sm:py-24 lg:py-32" aria-labelledby="pillars-heading">
                    <div className="mx-auto max-w-360 px-5 sm:px-8 lg:px-10">
                        <div className="flex flex-col gap-6 border-b border-[#cbd5ed] pb-8 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-xs font-bold tracking-[0.18em] text-[#1F2F98] sm:text-sm">THE BLUELY IDEA</p>
                                <h2 id="pillars-heading" className="mt-4 max-w-170 text-[clamp(2.5rem,4.8vw,5rem)] font-semibold leading-[1.06] tracking-[-0.055em]">More than an app.</h2>
                            </div>
                            <p className="max-w-82.5 text-sm leading-6 text-[#647396]">A practical platform, a listening space and a growing movement for representation.</p>
                        </div>
                        <div className="mt-12 grid gap-10 sm:mt-16 lg:grid-cols-3 lg:gap-9">
                            {pillars.map((pillar) => <article key={pillar.number} className="border-t border-[#9eadd1] pt-5"><p className="text-sm font-bold tracking-[0.12em] text-[#1F2F98]">{pillar.number}</p><h3 className="mt-8 text-3xl font-semibold tracking-[-0.04em]">{pillar.title}</h3><p className="mt-4 max-w-82.5 text-base leading-7 text-[#52617d]">{pillar.description}</p></article>)}
                        </div>
                    </div>
                </section>

                <section className="overflow-hidden bg-[#172853] py-20 text-white sm:py-24 lg:py-32" aria-labelledby="africa-heading">
                    <div className="relative mx-auto grid max-w-360 gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.5fr)_minmax(0,0.5fr)] lg:items-center lg:gap-20 lg:px-10">
                        <GiAfrica className="pointer-events-none absolute -right-20 top-1/2 hidden -translate-y-1/2 text-[min(58vw,760px)] leading-none text-[#aebfff]/8 lg:block" aria-hidden="true" />
                        <div className="relative z-10"><p className="text-xs font-bold tracking-[0.18em] text-[#aebfff] sm:text-sm">DESIGNED AROUND CONTEXT</p><h2 id="africa-heading" className="mt-5 max-w-162.5 text-[clamp(2.7rem,5vw,5.4rem)] font-semibold leading-[1.04] tracking-[-0.06em]">Africa is not an afterthought.</h2></div>
                        <div className="relative z-10 max-w-140 text-base leading-8 text-[#d6def2] sm:text-lg"><p>Health technology should feel familiar, useful and possible in the places it hopes to serve. That means listening to young people, respecting local realities and making room for many ways of living with diabetes.</p><p className="mt-6">We are building with that responsibility in view: slowly enough to listen, and ambitiously enough to matter.</p></div>
                    </div>
                </section>

                <section className="bg-[#f3f5fb] py-20 sm:py-24 lg:py-32" aria-labelledby="team-heading">
                    <div className="mx-auto max-w-360 px-5 sm:px-8 lg:px-10">
                        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.35fr)_minmax(0,0.65fr)] lg:gap-20">
                            <div><p className="text-xs font-bold tracking-[0.18em] text-[#1F2F98] sm:text-sm">THE PEOPLE BEHIND BLUELY</p><h2 id="team-heading" className="mt-5 text-[clamp(2.6rem,4.8vw,5rem)] font-semibold leading-[1.04] tracking-[-0.055em]">Built by people who care about what comes next.</h2></div>
                            <div>
                                <div className="grid gap-10 sm:grid-cols-2">{teamMembers.map((member, index) => <article key={member.name} className="border-t border-[#9eadd1] pt-5"><div className="mb-6 flex h-16 w-16 items-center justify-center bg-[#dfe7f8] text-xl font-semibold tracking-[-0.04em] text-[#1F2F98]" aria-hidden="true">0{index + 1}</div><h3 className="text-2xl font-semibold tracking-[-0.035em]">{member.name}</h3><p className="mt-2 text-xs font-bold tracking-[0.14em] text-[#1F2F98]">{member.role}</p><p className="mt-4 text-sm leading-7 text-[#52617d]">{member.bio}</p></article>)}</div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-[#eef2fc] py-16 sm:py-20" aria-label="Get involved">
                    <div className="mx-auto flex max-w-360 flex-col gap-7 px-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10"><div><p className="text-xs font-bold tracking-[0.18em] text-[#1F2F98]">KEEP BUILDING WITH US</p><p className="mt-3 max-w-155 text-2xl font-semibold tracking-[-0.035em] text-[#26375f] sm:text-3xl">The story is still being written.</p></div><div className="flex flex-wrap gap-5"><Link href="/share-your-story" className="group inline-flex min-h-12 items-center gap-3 rounded-full bg-[#1F2F98] px-5 py-2 text-sm font-bold text-white hover:bg-[#17257d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F2F98]">Share your story <ArrowCircle tone="blue" /></Link><Link href="/resources" className="inline-flex min-h-12 items-center gap-2 border-b border-[#1F2F98] text-sm font-bold text-[#1F2F98] hover:text-[#17257d] focus-visible:outline-2 focus-visible:outline-[#1F2F98]">Explore resources <FiArrowRight aria-hidden="true" /></Link></div></div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
