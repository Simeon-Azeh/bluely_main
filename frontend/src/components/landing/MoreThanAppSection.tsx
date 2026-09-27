export default function MoreThanAppSection() {
    const pillars = [
        { number: '01', title: 'UNDERSTAND', lines: <>Tools that help make<br />diabetes easier to<br />understand.</> },
        { number: '02', title: 'CONNECT', lines: <>Stories and community<br />that remind young people<br />they aren&apos;t alone.</> },
        { number: '03', title: 'AMPLIFY', lines: <>Creating space for young<br />African voices living<br />with diabetes.</> },
    ];

    return (
        <section id="more-than-an-app" aria-labelledby="more-than-app-heading" className="bg-[#eef2fc] py-20 text-[#172853] sm:py-24 lg:py-28">
            <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
                <h2 id="more-than-app-heading" className="max-w-[900px] text-[clamp(2.7rem,5.4vw,5.9rem)] font-semibold leading-[1.07] tracking-[-0.06em]">Bluely is more<br className="hidden sm:block" /> than an app.</h2>
                <div className="mt-14 grid gap-10 sm:mt-20 lg:grid-cols-3 lg:gap-9">
                    {pillars.map((pillar) => (
                        <div key={pillar.number} className="border-t border-[#9eadd1] pt-5">
                            <p className="text-sm font-semibold tracking-[0.1em] text-[#1F2F98]">{pillar.number}</p>
                            <h3 className="mt-8 text-[clamp(1.6rem,2.6vw,2.3rem)] font-semibold tracking-[-0.035em]">{pillar.title}</h3>
                            <p className="mt-4 text-lg leading-[1.6] text-[#52617e] sm:text-xl">{pillar.lines}</p>
                        </div>
                    ))}
                </div>
                <div className="mt-20 border-t border-[#9eadd1] pt-8 sm:mt-24 lg:flex lg:items-end lg:justify-between lg:gap-12">
                    <p className="text-xs font-bold tracking-[0.17em] text-[#1F2F98]">THE BLUELY IDEA</p>
                    <p className="mt-5 max-w-[850px] text-[clamp(1.7rem,3vw,3rem)] font-medium leading-[1.26] tracking-[-0.04em] lg:mt-0">Technology helps us understand the numbers.<br /><span className="text-[#1F2F98]">People give them meaning.</span></p>
                </div>
            </div>
        </section>
    );
}
