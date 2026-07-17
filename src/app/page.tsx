import { SwiverHero } from "@/components/sections/swiver-hero";
import { ModuleShowcase } from "@/components/sections/module-showcase";
import {
  StatsBand,
  CapabilitiesSection,
  BusinessesSection,
  SocialProofSection,
  PricingTeaser,
  SoftCTA,
} from "@/components/sections/home-swiver";
import { MobileAccessSection } from "@/components/sections/mobile-access-section";

export default function HomePage() {
  return (
    <>
      <SwiverHero />
      <ModuleShowcase />
      <StatsBand />
      <CapabilitiesSection />
      <MobileAccessSection />
      <BusinessesSection />
      <SocialProofSection />
      <PricingTeaser />
      <SoftCTA />
    </>
  );
}
