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

export default function HomePage() {
  return (
    <>
      <SwiverHero />
      <ModuleShowcase />
      <StatsBand />
      <CapabilitiesSection />
      <BusinessesSection />
      <SocialProofSection />
      <PricingTeaser />
      <SoftCTA />
    </>
  );
}
