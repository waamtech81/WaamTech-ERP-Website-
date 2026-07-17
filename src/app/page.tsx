import { SwiverHero } from "@/components/sections/swiver-hero";
import { HomeCatalogSearch } from "@/components/sections/home-catalog-search";
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
      <HomeCatalogSearch />
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
