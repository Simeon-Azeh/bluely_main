import Image from 'next/image';

export default function ProfileAvatar({ name, photoURL, size = 40 }: { name?: string | null; photoURL?: string | null; size?: number }) {
    const initials = name?.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'B';

    return (
        <span className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#dfe5ff] font-semibold text-[#1F2F98] ring-1 ring-[#1F2F98]/15 dark:border-[#222a4a] dark:bg-[#303b78] dark:text-white" style={{ width: size, height: size, fontSize: size * 0.32 }}>
            {photoURL ? <Image src={photoURL} alt={`${name || 'Your'} profile photo`} fill sizes={`${size}px`} className="object-cover" unoptimized /> : initials}
        </span>
    );
}
