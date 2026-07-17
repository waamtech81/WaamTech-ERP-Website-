import dynamic from "next/dynamic";
import { SwiverHero } from "@/components/sections/swiver-hero";
import {
  StatsBand,
  CapabilitiesSection,
  BusinessesSection,
  SocialProofSection,
  PricingTeaser,
  SoftCTA,
  FeaturedProductsSection,
} from "@/components/sections/home-swiver";
import { MobileAccessSection } from "@/components/sections/mobile-access-section";
import { AiHighlightSection } from "@/components/sections/ai-highlight-section";
import { TrustBadgesBand } from "@/components/sections/trust-badges-band";

const ModuleShowcase = dynamic(
  () =>
    import("@/components/sections/module-showcase").then((m) => ({
      default: m.ModuleShowcase,
    })),
  { ssr: true }
);

export default function HomePage() {
  return (
    <>
      <SwiverHero />
      <FeaturedProductsSection />
      <ModuleShowcase />
      <AiHighlightSection />
      <StatsBand />
      <CapabilitiesSection />
      <MobileAccessSection />
      <BusinessesSection />
      <SocialProofSection />
      <TrustBadgesBand />
      <PricingTeaser />
      <SoftCTA />
    </>
  );
}
