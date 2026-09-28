import {
    Header,
    HeroSection,
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

export default function Home() {
    return (
        <div className="min-h-screen bg-white">
            <Header />
            <HeroSection />
            <MissionSection />
            <MeetBluelySection />
            <MoreThanAppSection />
            <ResourcesSection />
            <ImpactSection />
            <ShareStorySection />
            <SupportSection />
            <NewsletterSection />
            <Footer />
        </div>
    );
}
