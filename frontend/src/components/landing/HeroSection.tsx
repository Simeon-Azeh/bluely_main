import Link from 'next/link';
import Image from 'next/image';
import ArrowCircle from './ArrowCircle';

export default function HeroSection() {
    return (
        <section className="relative overflow-hidden bg-[#f6f8ff] text-[#12204a] dark:bg-[#f6f8ff] dark:text-[#12204a]" aria-labelledby="hero-heading">
            <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 pb-9 pt-10 sm:px-8 sm:pt-14 lg:min-h-[700px] lg:grid-cols-[minmax(0,49fr)_minmax(0,51fr)] lg:gap-6 lg:px-10 lg:pb-12 lg:pt-16 xl:min-h-[760px]">
                <div className="relative z-10 max-w-[690px] lg:pb-12">
                    <h1 id="hero-heading" className="max-w-[680px] text-[clamp(2.75rem,4.9vw,5.4rem)] font-semibold leading-[1.08] tracking-[-0.06em]">
                        Diabetes is part of their story.
                        <span className="mt-2 block font-medium text-[#1F2F98]">It doesn&apos;t have to define it.</span>
                    </h1>
                    <p className="mt-7 max-w-[570px] text-[1.03rem] leading-[1.8] text-[#42516e] sm:text-lg">
                        Bluely brings technology, education and community together to help young people living with diabetes understand their health, share their experiences and feel heard.
                    </p>
                    <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
                        <Link href="#meet-bluely" className="group inline-flex min-h-13 items-center gap-4 rounded-full bg-[#1F2F98] py-2 pl-6 pr-2 text-sm font-bold text-white shadow-[0_10px_25px_rgba(31,47,152,0.16)] transition-transform hover:-translate-y-0.5 hover:bg-[#17257d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F2F98] motion-reduce:transform-none sm:text-base">
                            Explore Bluely <ArrowCircle tone="blue" />
                        </Link>
                        <Link href="#share-your-story" className="inline-flex min-h-12 items-center border-b-2 border-[#1F2F98] text-sm font-bold text-[#1F2F98] transition-colors hover:border-[#7485df] hover:text-[#17257d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F2F98] sm:text-base">
                            Share Your Story
                        </Link>
                    </div>
                </div>

                <div className="relative min-w-0 pb-12 sm:pb-16 lg:pb-20">
                    <div className="absolute -right-8 -top-7 h-[85%] w-[88%] rounded-[44%_56%_42%_58%] bg-[#dfe7ff]" aria-hidden="true" />
                    <div className="relative h-[390px] overflow-hidden rounded-t-[43%] rounded-b-[18px] bg-[#c5d0e9] sm:h-[490px] lg:h-[585px] xl:h-[640px]">
                        {/* Generated placeholder portrait; replace with approved Bluely photography when available. */}
                        <Image src="/images/bluely-teen-hero.png" alt="Young African person checking a glucose meter before a meal at home" fill priority sizes="(max-width: 1024px) 100vw, 51vw" className="object-cover object-[68%_center]" />
                    </div>
                    <div id="story" className="absolute -bottom-1 left-3 right-3 max-w-[380px] scroll-mt-28 border-l-[3px] border-[#9bb2f9] bg-[#15295b] px-5 py-4 text-white shadow-[0_15px_35px_rgba(12,28,70,0.22)] sm:left-[-24px] sm:px-7 sm:py-5 lg:bottom-5 lg:left-[-48px]">
                        <p className="text-[11px] font-bold tracking-[0.19em] text-[#bdcbff]">STORY SPACE</p>
                        <p className="mt-2 text-base leading-snug sm:text-lg">A space for young people to share more than their numbers.</p>
                        <p className="mt-2 text-xs text-[#cbd6f1]">Bluely&apos;s community vision</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
