import { publicMetadata, publicPages } from '@/lib/seo';

const page = publicPages.find((item) => item.path === '/about')!;
export const metadata = publicMetadata(page.title, page.description, page.path);

export default function PublicPageLayout({ children }: { children: React.ReactNode }) {
    return children;
}