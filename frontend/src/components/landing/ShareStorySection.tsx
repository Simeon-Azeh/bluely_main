import Image from 'next/image';
import Link from 'next/link';
import ArrowCircle from './ArrowCircle';

export default function ShareStorySection() {
    return (
        <section id="share-your-story" aria-labelledby="share-story-heading" className="scroll-mt-24 bg-[#f3f5fb] py-20 text-[#172853] sm:py-24 lg:py-28">
            <div className="mx-auto grid max-w-[1440px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,49fr)_minmax(0,51fr)] lg:gap-20 lg:px-10">
                <div className="relative aspect-[4/4.6] overflow-hidden bg-[#b9c7e7] sm:aspect-[5/4] lg:aspect-[4/4.8]">
                    {/* Generated composition: replace with consented photography of real Bluely storytellers when available. */}
                    <Image src="/images/mission-youth-voices.png" alt="African young people sharing a conversation outdoors" fill sizes="(max-width: 1023px) 100vw, 50vw" className="object-cover" />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#172853]/30 via-transparent to-transparent" />
                    <span className="absolute bottom-5 left-5 border border-white/55 bg-white/20 px-4 py-2 text-xs font-semibold tracking-[0.14em] text-white backdrop-blur-md sm:bottom-8 sm:left-8">EVERY STORY HAS A VOICE</span>
                </div>
                <div className="lg:py-8">
                    <p className="text-xs font-bold tracking-[0.17em] text-[#1F2F98] sm:text-sm">YOUR EXPERIENCE MATTERS</p>
                    <h2 id="share-story-heading" className="mt-5 max-w-[700px] text-[clamp(2.75rem,5vw,5.5rem)] font-semibold leading-[1.08] tracking-[-0.055em]">Your story might be exactly what someone else needs to hear.</h2>
                    <p className="mt-7 max-w-[570px] text-base leading-[1.8] text-[#52617d] sm:text-lg">Living with diabetes comes with moments people don&apos;t always see. Share your experience with Bluely and help another young person feel a little less alone.</p>
                    <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-5">
                        <a href="mailto:support@bluely.health?subject=Share%20my%20Bluely%20story" className="group inline-flex min-h-13 items-center gap-4 rounded-full bg-[#1F2F98] py-2 pl-6 pr-2 text-sm font-bold text-white transition-colors hover:bg-[#17257d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F2F98] sm:text-base">Share Your Story <ArrowCircle tone="blue" /></a>
                        <Link href="/#stories" className="group inline-flex min-h-12 items-center gap-3 border-b border-[#1F2F98] text-sm font-bold text-[#1F2F98] transition-colors hover:text-[#17257d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F2F98] sm:text-base">Watch Stories <ArrowCircle tone="text" /></Link>
                    </div>
                    <p className="mt-8 border-l-2 border-[#8293da] pl-4 text-sm leading-[1.6] text-[#52617d]">You choose what you&apos;re comfortable sharing.</p>
                </div>
            </div>
        </section>
    );
}
