import dynamic from "next/dynamic";
import { SwiverHero } from "@/components/sections/swiver-hero";

const ModuleShowcase = dynamic(
  () =>
    import("@/components/sections/module-showcase").then((m) => ({
      default: m.ModuleShowcase,
    })),
  { ssr: true }
);
const BusinessesSection = dynamic(
  () =>
    import("@/components/sections/home-swiver").then((m) => ({
      default: m.BusinessesSection,
    })),
  { ssr: true }
);
const SocialProofSection = dynamic(
  () =>
    import("@/components/sections/home-swiver").then((m) => ({
      default: m.SocialProofSection,
    })),
  { ssr: true }
);
const TrustBadgesBand = dynamic(
  () =>
    import("@/components/sections/trust-badges-band").then((m) => ({
      default: m.TrustBadgesBand,
    })),
  { ssr: true }
);
const PricingTeaser = dynamic(
  () =>
    import("@/components/sections/home-swiver").then((m) => ({
      default: m.PricingTeaser,
    })),
  { ssr: true }
);
const SoftCTA = dynamic(
  () =>
    import("@/components/sections/home-swiver").then((m) => ({
      default: m.SoftCTA,
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
