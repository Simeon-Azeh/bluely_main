import Image from 'next/image';

type SkeletonVariant = 'home' | 'page' | 'auth' | 'onboarding' | 'app';

function SiteHeaderSkeleton() {
    return (
        <div className="mx-auto flex h-[82px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-10">
            <Image src="/icons/full_logotext.png" alt="Bluely" width={130} height={40} priority />
            <div className="hidden h-9 w-80 rounded-full bg-[#e4eaf8] md:block" />
        </div>
    );
}

export default function PageSkeleton({ variant = 'page' }: { variant?: SkeletonVariant }) {
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

    if (variant === 'auth' || variant === 'onboarding') {
        const isOnboarding = variant === 'onboarding';
        return (
            <div className="grid min-h-screen bg-[#f6f8ff] lg:grid-cols-[minmax(0,42fr)_minmax(0,58fr)]" role="status" aria-label={isOnboarding ? 'Loading Bluely setup' : 'Loading Bluely sign in'}>
                <span className="sr-only">{isOnboarding ? 'Loading Bluely setup' : 'Loading Bluely sign in'}</span>
                <div className="flex min-h-[250px] flex-col justify-between bg-[#172853] px-6 pb-9 pt-7 sm:px-10 lg:min-h-screen lg:px-14 lg:pb-14 lg:pt-12">
                    <span className="text-3xl font-semibold tracking-[-0.08em] text-white sm:text-4xl">BLUELY</span>
                    <div className="max-w-[530px] space-y-4 animate-pulse motion-reduce:animate-none">
                        <div className="h-10 w-4/5 rounded-xl bg-white/20 sm:h-14" />
                        <div className="h-10 w-3/5 rounded-xl bg-white/20 sm:h-14" />
                        <div className="mt-6 h-4 w-4/5 rounded bg-white/15" />
                        <div className="h-4 w-3/5 rounded bg-white/15" />
                        {isOnboarding && <div className="hidden space-y-4 pt-10 lg:block">{[0, 1, 2].map((item) => <div key={item} className="h-9 w-52 rounded-lg bg-white/10" />)}</div>}
                    </div>
                </div>
                <div className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
                    <div className="w-full max-w-[520px] space-y-6 animate-pulse motion-reduce:animate-none">
                        <div className="h-4 w-24 rounded bg-[#dce5f7]" />
                        {isOnboarding && <div className="h-2 w-full rounded-full bg-[#dce5f7]" />}
                        <div className="h-9 w-3/4 rounded-lg bg-[#dce5f7]" />
                        <div className="h-4 w-4/5 rounded bg-[#e4eaf8]" />
                        <div className="h-14 w-full rounded-2xl bg-[#e4eaf8]" />
                        <div className="h-14 w-full rounded-2xl bg-[#e4eaf8]" />
                        <div className="h-14 w-full rounded-2xl bg-[#cbd7f3]" />
                    </div>
                </div>
            </div>
        );
    }

    if (variant === 'home') {
        return (
            <div className="min-h-screen bg-[#f6f8ff]" role="status" aria-label="Loading Bluely homepage">
                <span className="sr-only">Loading Bluely homepage</span>
                <div className="animate-pulse motion-reduce:animate-none">
                    <SiteHeaderSkeleton />
                    <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-12 sm:px-8 lg:grid-cols-2 lg:items-center lg:px-10">
                        <div className="space-y-5"><div className="h-12 w-full max-w-[520px] rounded-xl bg-[#e4eaf8]" /><div className="h-12 w-4/5 rounded-xl bg-[#e4eaf8]" /><div className="mt-8 h-5 w-full max-w-[500px] rounded-lg bg-[#e4eaf8]" /><div className="h-5 w-4/5 rounded-lg bg-[#e4eaf8]" /><div className="mt-8 h-12 w-44 rounded-full bg-[#d4def5]" /></div>
                        <div className="h-[390px] rounded-t-[42%] rounded-b-2xl bg-[#dce5f7] sm:h-[510px]" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f6f8ff]" role="status" aria-label="Loading Bluely page">
            <span className="sr-only">Loading Bluely page</span>
            <div className="animate-pulse motion-reduce:animate-none">
                <SiteHeaderSkeleton />
                <div className="mx-auto max-w-[1160px] px-5 pb-20 pt-14 sm:px-8 sm:pt-20">
                    <div className="h-4 w-36 rounded bg-[#d4def5]" />
                    <div className="mt-7 h-11 w-full max-w-[760px] rounded-xl bg-[#e4eaf8] sm:h-16" />
                    <div className="mt-4 h-11 w-4/5 max-w-[640px] rounded-xl bg-[#e4eaf8] sm:h-16" />
                    <div className="mt-7 h-5 w-full max-w-[580px] rounded bg-[#e4eaf8]" />
                    <div className="mt-3 h-5 w-3/4 max-w-[490px] rounded bg-[#e4eaf8]" />
                    <div className="mt-16 grid gap-6 border-t border-[#dce5f7] pt-8 sm:grid-cols-2"><div className="h-52 rounded-2xl bg-[#e4eaf8]" /><div className="h-52 rounded-2xl bg-[#e4eaf8]" /></div>
                </div>
            </div>
        </div>
    );
}
