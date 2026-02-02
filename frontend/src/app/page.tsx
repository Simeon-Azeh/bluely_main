import {
    Header,
    HeroSection,
    WhatIsBluelySection,
    HowItWorksSection,
    DifferenceSection,
    VisionSection,
    CTASection,
    Footer,
} from '@/components/landing';

export default function Home() {
    return (
        <div className="min-h-screen bg-white">
            <Header />
            <HeroSection />
            <WhatIsBluelySection />
            <HowItWorksSection />
            <DifferenceSection />
            <VisionSection />
            <CTASection />
            <Footer />
        </div>
    );
}
