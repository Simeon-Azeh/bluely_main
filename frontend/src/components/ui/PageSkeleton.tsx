import Image from 'next/image';

export default function PageSkeleton({ variant = 'website' }: { variant?: 'website' | 'app' }) {
    if (variant === 'app') {
        return (
            <div className="min-h-screen bg-[#f6f8ff] p-5 dark:bg-[#121212] sm:p-8" role="status" aria-label="Loading Bluely app">
                <span className="sr-only">Loading Bluely app</span>
                <div className="mx-auto flex max-w-7xl gap-7 animate-pulse motion-reduce:animate-none">
                    <div className="hidden h-[80vh] w-60 shrink-0 rounded-2xl bg-[#e3e9f7] dark:bg-[#292929] md:block" />
                    <div className="w-full space-y-7">
                        <div className="h-10 w-56 rounded-lg bg-[#e3e9f7] dark:bg-[#292929]" />
                        <div className="grid gap-4 sm:grid-cols-3"><div className="h-32 rounded-2xl bg-[#e3e9f7] dark:bg-[#292929]" /><div className="h-32 rounded-2xl bg-[#e3e9f7] dark:bg-[#292929]" /><div className="h-32 rounded-2xl bg-[#e3e9f7] dark:bg-[#292929]" /></div>
                        <div className="h-72 rounded-2xl bg-[#e3e9f7] dark:bg-[#292929]" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f6f8ff]" role="status" aria-label="Loading Bluely website">
            <span className="sr-only">Loading Bluely website</span>
            <div className="mx-auto flex h-[82px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-10">
                <Image src="/icons/full_logotext.png" alt="Bluely" width={130} height={40} priority />
                <div className="hidden h-9 w-80 rounded-full bg-[#e4eaf8] animate-pulse motion-reduce:animate-none md:block" />
            </div>
            <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-12 sm:px-8 lg:grid-cols-2 lg:items-center lg:px-10">
                <div className="space-y-5 animate-pulse motion-reduce:animate-none"><div className="h-12 w-full max-w-[520px] rounded-xl bg-[#e4eaf8]" /><div className="h-12 w-4/5 rounded-xl bg-[#e4eaf8]" /><div className="mt-8 h-5 w-full max-w-[500px] rounded-lg bg-[#e4eaf8]" /><div className="h-5 w-4/5 rounded-lg bg-[#e4eaf8]" /><div className="mt-8 h-12 w-44 rounded-full bg-[#d4def5]" /></div>
                <div className="h-[390px] rounded-t-[42%] rounded-b-2xl bg-[#dce5f7] animate-pulse motion-reduce:animate-none sm:h-[510px]" />
            </div>
        </div>
    );
}
