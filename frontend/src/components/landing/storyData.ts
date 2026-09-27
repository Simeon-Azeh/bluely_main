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

// TODO: Replace these generated sample covers and neutral story titles with approved Bluely stories.
// Add a real videoUrl to activate its card and dedicated story page automatically.
export const stories: Story[] = [
    { id: '01', title: 'Living beyond the numbers', category: 'YOUTH STORY', cover: '/images/mission-youth-voices.png', alt: 'Young African people in conversation outdoors', heightClass: 'h-[370px] sm:h-[410px]', videoUrl: null },
    { id: '02', title: 'What I wish people understood', category: 'LIVING WITH DIABETES', cover: '/images/story-reflection.png', alt: 'Young African woman reflecting beside a window', heightClass: 'h-[430px] sm:h-[490px]', videoUrl: null },
    { id: '03', title: 'Finding people who understand', category: 'COMMUNITY', cover: '/images/mission-community.png', alt: 'African young people talking together in a courtyard', heightClass: 'h-[355px] sm:h-[390px]', videoUrl: null },
    { id: '04', title: 'School, friends & diabetes', category: 'EVERYDAY LIFE', cover: '/images/story-school.png', alt: 'African teenagers walking together after school', heightClass: 'h-[405px] sm:h-[450px]', videoUrl: null },
    { id: '05', title: 'More than a diagnosis', category: 'YOUTH VOICES', cover: '/images/bluely-teen-hero.png', alt: 'Young African person at home before a meal', heightClass: 'h-[365px] sm:h-[400px]', objectPosition: 'object-[68%_center]', videoUrl: null },
    { id: '06', title: 'Learning to speak about it', category: 'EDUCATION', cover: '/images/mission-education.png', alt: 'Young people learning together from a booklet', heightClass: 'h-[420px] sm:h-[470px]', videoUrl: null },
];
