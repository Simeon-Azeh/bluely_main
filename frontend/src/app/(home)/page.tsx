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

export default function Home() {
    return (
        <div className="min-h-screen bg-white">
            <Header />
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
            <Footer />
        </div>
    );
}
