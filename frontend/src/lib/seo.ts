import type { Metadata } from 'next';

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://bluely.org').replace(/\/$/, '');
export const founder = { name: 'Simeon Azeh', url: `${siteUrl}/about#team-heading` };
export const socialImage = { url: '/images/bluely-og.jpg', width: 1200, height: 630, alt: 'Bluely — More than a diagnosis. Diabetes tools, education and community for Africa. Founded by Simeon Azeh.' };

export function publicMetadata(title: string, description: string, path: string): Metadata {
    return {
        title, description,
        alternates: { canonical: path },
        robots: { index: true, follow: true },
        openGraph: { type: 'website', siteName: 'Bluely', locale: 'en_US', title, description, url: path, images: [socialImage] },
        twitter: { card: 'summary_large_image', title, description, images: [socialImage] },
    };
}

export const publicPages = [
    { path: '/', title: 'Bluely | Diabetes Tools, Education & Community in Africa', description: 'Founded by Simeon Azeh, Bluely brings diabetes tools, education and community together to support young people living with diabetes across Africa.' },
    { path: '/about', title: 'About Bluely | Founded by Simeon Azeh', description: 'Meet founder Simeon Azeh and the Bluely team building diabetes tools, education and community for young people across Africa.' },
    { path: '/mission', title: 'Our Mission | Bluely', description: 'Discover Bluely’s mission to support young people living with diabetes through education, community and accessible technology in Africa.' },
    { path: '/resources', title: 'Diabetes Education & Resources | Bluely', description: 'Explore clear diabetes education for young people, families and communities, including Type 1 diabetes, school life and supporting someone with diabetes.' },
    { path: '/contact', title: 'Contact Bluely', description: 'Contact the Bluely team about diabetes education, community, partnerships and the platform.' },
    { path: '/volunteer', title: 'Volunteer with Bluely', description: 'Bring your skills and experience to Bluely’s work in diabetes education, technology and community in Africa.' },
    { path: '/share-your-story', title: 'Share Your Diabetes Story | Bluely', description: 'Share your experience of living with diabetes and help another young person feel heard and less alone.' },
    { path: '/channels', title: 'Bluely Community Channels', description: 'Explore planned ways to connect with Bluely and access diabetes tools and community in familiar apps.' },
    { path: '/privacy', title: 'Privacy & Data Protection | Bluely', description: 'Learn how Bluely handles personal information, health data and community stories, and how to exercise your privacy choices.' },
    { path: '/terms', title: 'Terms of Service | Bluely', description: 'Read the terms that guide use of Bluely’s platform and community services.' },
    { path: '/medical-disclaimer', title: 'Medical Disclaimer | Bluely', description: 'Understand the scope of Bluely’s diabetes education and self-management tools and when to seek professional medical advice.' },
];

export const organizationSchema = {
    '@context': 'https://schema.org',
    '@graph': [
        { '@type': 'Organization', '@id': `${siteUrl}/#organization`, name: 'Bluely', url: siteUrl, description: publicPages[0].description, logo: `${siteUrl}/icons/full_logotext.png`, founder: { '@id': `${siteUrl}/#founder` } },
        { '@type': 'Person', '@id': `${siteUrl}/#founder`, name: founder.name, jobTitle: 'Founder of Bluely', url: founder.url, image: `${siteUrl}/images/real/simeon.webp`, worksFor: { '@id': `${siteUrl}/#organization` } },
        { '@type': 'WebSite', '@id': `${siteUrl}/#website`, url: siteUrl, name: 'Bluely', inLanguage: 'en', publisher: { '@id': `${siteUrl}/#organization` }, creator: { '@id': `${siteUrl}/#founder` } },
    ],
};
