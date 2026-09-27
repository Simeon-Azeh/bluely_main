import Link from 'next/link';
import ArrowCircle from './ArrowCircle';

function ProductPreview() {
    return (
        <div className="relative mx-auto h-[520px] w-full max-w-[660px] sm:h-[600px] lg:h-[640px]" aria-label="Illustrative preview of Bluely on phone and web">
            <div className="absolute right-0 top-6 h-[360px] w-[85%] overflow-hidden rounded-[20px] border border-[#d9e2f4] bg-[#ffffff] shadow-[0_26px_60px_rgba(22,43,96,0.12)] sm:top-14 sm:h-[405px] sm:w-[82%]">
                <div className="flex h-11 items-center gap-2 border-b border-[#e7ecf6] px-5"><span className="h-2 w-2 rounded-full bg-[#c6d1ea]" /><span className="h-2 w-2 rounded-full bg-[#c6d1ea]" /><span className="h-2 w-2 rounded-full bg-[#c6d1ea]" /><span className="ml-auto text-[10px] font-semibold tracking-wide text-[#7785a2]">BLUELY WEB</span></div>
                <div className="px-5 py-6 sm:px-8 sm:py-8">
                    <p className="text-[11px] font-bold tracking-[0.15em] text-[#1F2F98]">YOUR DAILY CONTEXT</p>
                    <h3 className="mt-3 max-w-[310px] text-2xl font-semibold leading-tight tracking-[-0.04em] text-[#172853] sm:text-3xl">The whole day, in one clearer view.</h3>
                    <div className="mt-7 hidden items-center gap-3 text-xs font-semibold text-[#536482] sm:flex"><span>GLUCOSE</span><span className="h-px w-5 bg-[#aabbe5]" /><span>MEALS</span><span className="h-px w-5 bg-[#aabbe5]" /><span>ACTIVITY</span><span className="h-px w-5 bg-[#aabbe5]" /><span>HABITS</span></div>
                    <div className="mt-10 border-b border-[#dce5f4] pb-3 sm:mt-7">
                        <p className="text-xs font-semibold text-[#677796]">Sample overview</p>
                        <svg viewBox="0 0 430 80" className="mt-3 h-20 w-full" role="img" aria-label="Illustrative trend line"><path d="M0 61 C35 55 51 32 82 44 S133 70 170 48 S224 31 260 45 S319 59 350 31 S401 30 430 23" fill="none" stroke="#6985de" strokeWidth="3" strokeLinecap="round" /><path d="M0 61 C35 55 51 32 82 44 S133 70 170 48 S224 31 260 45 S319 59 350 31 S401 30 430 23" fill="none" stroke="#6985de" strokeWidth="12" opacity=".08" /></svg>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 h-[430px] w-[235px] overflow-hidden rounded-[32px] border-[7px] border-[#172853] bg-[#fcfdff] shadow-[0_30px_60px_rgba(12,28,70,0.2)] sm:h-[495px] sm:w-[265px] lg:left-2">
                <div className="mx-auto mt-2 h-1.5 w-16 rounded-full bg-[#172853]" aria-hidden="true" />
                <div className="px-5 pb-5 pt-6 sm:px-6">
                    <div className="flex items-center justify-between"><span className="text-lg font-bold tracking-[-0.06em] text-[#1F2F98]">bluely.</span><span className="h-7 w-7 rounded-full bg-[#dfe7fb]" aria-hidden="true" /></div>
                    <p className="mt-9 text-xs font-medium text-[#6c7b98]">Good morning</p>
                    <h3 className="mt-1 text-xl font-semibold leading-tight tracking-[-0.04em] text-[#172853] sm:text-2xl">Your day is more than a number.</h3>
                    <p className="mt-7 text-[10px] font-bold tracking-[0.14em] text-[#1F2F98]">TODAY AT A GLANCE</p>
                    <div className="mt-3 space-y-0 text-[#172853]">
                        <div className="flex items-end justify-between border-b border-[#e4eaf5] py-3"><span className="text-sm font-medium">Glucose</span><span className="text-base font-bold">126 <span className="text-[10px] font-medium text-[#667694]">mg/dL</span></span></div>
                        <div className="flex items-end justify-between border-b border-[#e4eaf5] py-3"><span className="text-sm font-medium">Breakfast</span><span className="text-xs font-semibold text-[#667694]">Logged · 8:14 AM</span></div>
                        <div className="flex items-end justify-between border-b border-[#e4eaf5] py-3"><span className="text-sm font-medium">Activity</span><span className="text-xs font-semibold text-[#667694]">32 min</span></div>
                    </div>
                    <p className="mt-5 text-[11px] leading-relaxed text-[#5e6e8d]">See your routines alongside your readings.</p>
                </div>
            </div>
            <span className="absolute bottom-1 right-0 rounded-full border border-[#dce5f4] bg-[#ffffff] px-4 py-2 text-[11px] font-bold tracking-wide text-[#526689] sm:right-4">ILLUSTRATIVE PRODUCT PREVIEW</span>
        </div>
    );
}

export default function MeetBluelySection() {
    return (
        <section id="meet-bluely" aria-labelledby="meet-bluely-heading" className="overflow-hidden bg-[#ffffff] py-20 text-[#172853] sm:py-24 lg:py-28">
            <div className="mx-auto grid max-w-[1440px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,43fr)_minmax(0,57fr)] lg:gap-10 lg:px-10">
                <div className="max-w-[590px]">
                    <p className="text-xs font-bold tracking-[0.17em] text-[#1F2F98] sm:text-sm">BUILT FOR EVERYDAY LIFE</p>
                    <h2 id="meet-bluely-heading" className="mt-6 text-[clamp(2.75rem,4.6vw,5rem)] font-semibold leading-[1.1] tracking-[-0.055em]">Understand your diabetes. <span className="block text-[#1F2F98]">Not just your numbers.</span></h2>
                    <p className="mt-7 max-w-[530px] text-base leading-[1.8] text-[#4c5c78] sm:text-lg">Bluely brings glucose, meals, activity and everyday habits together, helping you recognise patterns and better understand what affects your health.</p>
                    <div className="mt-9 flex flex-wrap items-center gap-6">
                        <Link href="/signup" className="group inline-flex min-h-13 items-center gap-4 rounded-full bg-[#1F2F98] py-2 pl-6 pr-2 text-sm font-bold text-white transition-colors hover:bg-[#17257d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F2F98] sm:text-base">Explore the Platform <ArrowCircle tone="blue" /></Link>
                        <span className="text-xs font-medium text-[#6b7b98]">Tracking · Education · Patterns</span>
                    </div>
                </div>
                <ProductPreview />
            </div>
        </section>
    );
}
