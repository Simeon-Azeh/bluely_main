export type Story = {
    id: string;
    title: string;
    category: string;
    cover: string;
    alt: string;
    heightClass: string;
    objectPosition?: string;
    videoUrl: string | null;
};

// Illustrative photography, not testimonials from the people pictured.
// Add approved films and storyteller details before activating video links.
export const stories: Story[] = [
    { id: '01', title: 'The everyday moments', category: 'DAILY CARE', cover: '/images/real/daily-care.webp', alt: 'A man checking his glucose at home', heightClass: 'h-[370px] sm:h-[410px]', videoUrl: null },
    { id: '02', title: 'Making room for care', category: 'LIVING WITH DIABETES', cover: '/images/real/woman-at-home.webp', alt: 'A woman checking glucose at her table', heightClass: 'h-[430px] sm:h-[490px]', videoUrl: null },
    { id: '03', title: 'Care within reach', category: 'ACCESS', cover: '/images/real/pharmacy.webp', alt: 'A customer speaking with a pharmacist', heightClass: 'h-[355px] sm:h-[390px]', videoUrl: null },
    { id: '04', title: 'Understanding the routine', category: 'EDUCATION', cover: '/images/real/glucose-check.webp', alt: 'Close-up of hands using a finger-prick device', heightClass: 'h-[405px] sm:h-[450px]', videoUrl: null },
];
