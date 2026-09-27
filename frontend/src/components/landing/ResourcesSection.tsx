import Link from 'next/link';
import ArrowCircle from './ArrowCircle';
import { resources } from './resourceData';

export default function ResourcesSection() {
    const [featured, second, third] = resources;

    return (
        <section id="resources" aria-labelledby="resources-heading" className="bg-[#ffffff] py-20 text-[#172853] sm:py-24 lg:py-28">
            <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,60fr)_minmax(0,40fr)] lg:items-end lg:gap-12">
                    <div>
                        <p className="text-xs font-bold tracking-[0.17em] text-[#1F2F98] sm:text-sm">LEARN WITH BLUELY</p>
                        <h2 id="resources-heading" className="mt-5 max-w-[780px] text-[clamp(2.55rem,4.8vw,5.1rem)] font-semibold leading-[1.1] tracking-[-0.055em]">Diabetes can be complicated. <span className="text-[#1F2F98]">Learning about it shouldn&apos;t be.</span></h2>
                    </div>
                    <p className="max-w-[420px] text-base leading-[1.8] text-[#53617c] sm:text-lg lg:pb-2">Clear starting points for young people, families and the communities around them.</p>
                </div>

                <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,54fr)_minmax(0,46fr)] lg:gap-12">
                    <Link href={`/resources/${featured.slug}`} className="group flex min-h-[420px] flex-col justify-between bg-[#172b5a] p-7 text-white transition-colors hover:bg-[#1c3470] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F2F98] sm:min-h-[480px] sm:p-10">
                        <div className="flex items-start justify-between gap-4"><span className="text-xs font-bold tracking-[0.16em] text-[#c6d5ff]">{featured.category}</span><span className="text-sm font-semibold text-[#c6d5ff]">01 / 03</span></div>
                        <div><h3 className="max-w-[490px] text-[clamp(2.25rem,3.8vw,4.1rem)] font-semibold leading-[1.12] tracking-[-0.05em]">{featured.title}</h3><p className="mt-4 max-w-[470px] text-base leading-[1.65] text-[#d6def2]">{featured.summary}</p><div className="mt-8 flex items-center justify-between border-t border-white/25 pt-5 text-sm font-semibold"><span>{featured.readTime}</span><ArrowCircle tone="blue" /></div></div>
                    </Link>
                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1 lg:gap-9">
                        {[second, third].map((resource, index) => <Link key={resource.slug} href={`/resources/${resource.slug}`} className="group flex min-h-[230px] flex-col justify-between border-t border-[#9eadd1] pt-5 text-[#172853] transition-colors hover:text-[#1F2F98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F2F98] lg:min-h-[220px]"><div><div className="flex items-center justify-between"><span className="text-xs font-bold tracking-[0.16em] text-[#1F2F98]">{resource.category}</span><span className="text-xs font-semibold text-[#8b99b6]">0{index + 2} / 03</span></div><h3 className="mt-5 max-w-[350px] text-[clamp(1.8rem,2.7vw,2.7rem)] font-semibold leading-[1.15] tracking-[-0.045em]">{resource.title}</h3></div><div className="flex items-center justify-between text-sm font-semibold text-[#53617c]"><span>{resource.readTime}</span><ArrowCircle tone="text" /></div></Link>)}
                    </div>
                </div>
                <div className="mt-12 flex justify-end">
                    <Link href="/resources" className="group inline-flex min-h-13 items-center gap-4 rounded-full bg-[#1F2F98] py-2 pl-6 pr-2 text-sm font-bold text-white hover:bg-[#17257d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F2F98] sm:text-base">Explore Resources <ArrowCircle tone="blue" /></Link>
                </div>
            </div>
        </section>
    );
}
