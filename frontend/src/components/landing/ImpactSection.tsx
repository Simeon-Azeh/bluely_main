import { GiAfrica } from 'react-icons/gi';

const aspirations = [
    { title: 'Education', description: 'Clear diabetes information.' },
    { title: 'Representation', description: 'More African diabetes stories.' },
    { title: 'Community', description: 'Spaces to feel understood.' },
    { title: 'Technology', description: 'Tools designed around real life.' },
];

export default function ImpactSection() {
    return (
        <section id="future" aria-labelledby="future-heading" className="relative scroll-mt-24 overflow-hidden bg-[#172853] py-20 text-white sm:py-24 lg:py-32">
            <div className="pointer-events-none absolute -right-16 top-24 hidden text-[min(62vw,800px)] leading-none text-[#aebeff]/[0.09] lg:block" aria-hidden="true"><GiAfrica /></div>
            <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
                <p className="text-xs font-bold tracking-[0.17em] text-[#aebeff] sm:text-sm">THE FUTURE WE&apos;RE WORKING TOWARD</p>
                <h2 id="future-heading" className="mt-6 max-w-[1040px] text-[clamp(2.55rem,5.3vw,6rem)] font-semibold leading-[1.08] tracking-[-0.058em]">A future where every young person living with diabetes in Africa has access to <span className="text-[#aebeff]">understanding, support and a community that listens.</span></h2>
                <div className="mt-16 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:mt-24 lg:grid-cols-4">
                    {aspirations.map(({ title, description }, index) => (
                        <div key={title} className="border-t border-white/30 pt-5">
                            <p className="text-xs font-semibold tracking-[0.15em] text-[#aebeff]">0{index + 1}</p>
                            <h3 className="mt-7 text-2xl font-semibold tracking-[-0.03em] sm:text-[1.7rem]">{title}</h3>
                            <p className="mt-3 max-w-[250px] text-base leading-[1.65] text-[#d9e1f5]">{description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
