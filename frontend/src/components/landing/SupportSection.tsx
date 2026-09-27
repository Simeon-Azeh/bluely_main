import ArrowCircle from './ArrowCircle';

const priorities = [
    'DIABETES EDUCATION',
    'YOUTH STORIES',
    'COMMUNITY PROGRAMMES',
    'ACCESSIBLE TECHNOLOGY',
];

export default function SupportSection() {
    return (
        <section id="support" aria-labelledby="support-heading" className="scroll-mt-24 bg-[#1F2F98] py-20 text-white sm:py-24 lg:py-32">
            <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
                <p className="text-xs font-bold tracking-[0.17em] text-[#c6d3ff] sm:text-sm">HELP MOVE THE MISSION FORWARD</p>
                <div className="mt-6 grid gap-12 lg:grid-cols-[minmax(0,62fr)_minmax(0,38fr)] lg:gap-20">
                    <h2 id="support-heading" className="max-w-[870px] text-[clamp(2.7rem,5.2vw,5.9rem)] font-semibold leading-[1.08] tracking-[-0.058em]">Support better diabetes education, stronger communities and more young voices across Africa.</h2>
                    <div className="lg:pt-3">
                        <p className="max-w-[380px] text-lg leading-[1.6] text-[#d9e2ff]">Your support helps Bluely create</p>
                        <ul className="mt-7 border-t border-white/35">
                            {priorities.map((priority) => <li key={priority} className="border-b border-white/35 py-4 text-sm font-bold tracking-[0.1em] sm:text-base">{priority}</li>)}
                        </ul>
                        <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-5">
                            {/* Until a donation flow exists, this opens a direct support conversation. */}
                            <a href="mailto:support@bluely.health?subject=Support%20Bluely" className="group inline-flex min-h-13 items-center gap-4 rounded-full bg-[#ffffff] py-2 pl-6 pr-2 text-sm font-bold text-[#1F2F98] transition-colors hover:bg-[#e9edfc] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:text-base">Donate <ArrowCircle tone="white" /></a>
                            <a href="mailto:support@bluely.health?subject=Partner%20with%20Bluely" className="group inline-flex min-h-12 items-center gap-3 border-b border-white/75 text-sm font-bold text-white transition-colors hover:text-[#d9e2ff] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:text-base">Become a Partner <ArrowCircle tone="text" /></a>
                        </div>
                        <p className="mt-5 text-xs leading-[1.6] text-[#d9e2ff]">The donate link opens an email to our team while we prepare a giving page.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
