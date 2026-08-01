import dynamic from "next/dynamic";
import { SwiverHero } from "@/components/sections/swiver-hero";
import {
  BusinessesSection,
  SocialProofSection,
  PricingTeaser,
  SoftCTA,
} from "@/components/sections/home-swiver";
import { TrustBadgesBand } from "@/components/sections/trust-badges-band";

const ModuleShowcase = dynamic(
  () =>
    import("@/components/sections/module-showcase").then((m) => ({
      default: m.ModuleShowcase,
    })),
  { ssr: true }
);

/**
 * Homepage composition — keep brand, search, product preview, and a short
 * journey. Heavy duplicate bands (AI/stats/capabilities/mobile) removed to
 * reduce scroll without changing routes or commercial APIs.
 */
export default function HomePage() {
  return (
    <>
      <SwiverHero />
      <div className="home-below-fold">
        <ModuleShowcase />
        <BusinessesSection />
        <SocialProofSection />
        <TrustBadgesBand />
        <PricingTeaser />
        <SoftCTA />
      </div>
    </>
  );
}
