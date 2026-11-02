import {
    Header,
    HeroSection,
    AffordabilitySection,
    MissionSection,
    MeetBluelySection,
    MoreThanAppSection,
    ResourcesSection,
    ImpactSection,
    ShareStorySection,
    SupportSection,
    NewsletterSection,
    Footer,
} from '@/components/landing';
import PhotoStory from '@/components/landing/PhotoStory';
import IntroductionSection from '@/components/landing/IntroductionSection';
import { publicMetadata, publicPages } from '@/lib/seo';

export const metadata = publicMetadata(publicPages[0].title, publicPages[0].description, '/');

export default function Home() {
    return (
        <div className="min-h-screen bg-white">
            <Header />
            <main>
            <HeroSection />
            <IntroductionSection />
            <AffordabilitySection />
            <MissionSection />
            <MeetBluelySection />
            <MoreThanAppSection />
            <ResourcesSection />
            <ImpactSection />
            <ShareStorySection />
            <PhotoStory chapter="access" />
            <SupportSection />
            <NewsletterSection />
            </main>
            <Footer />
        </div>
    );
}
