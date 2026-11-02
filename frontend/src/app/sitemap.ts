import type { MetadataRoute } from 'next';
import { publicPages, siteUrl } from '@/lib/seo';
import { resources } from '@/components/landing/resourceData';
import { stories } from '@/components/landing/storyData';

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        ...publicPages.map(({ path }) => ({ url: `${siteUrl}${path}`, priority: path === '/' ? 1 : 0.7 })),
        ...resources.map(({ slug }) => ({ url: `${siteUrl}/resources/${slug}`, priority: 0.6 })),
        ...stories.filter(({ videoUrl }) => Boolean(videoUrl)).map(({ id }) => ({ url: `${siteUrl}/stories/${id}`, priority: 0.6 })),
    ];
}
