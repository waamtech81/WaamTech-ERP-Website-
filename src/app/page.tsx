import { HeroSection } from "@/components/sections/hero";
import { FeaturesSection, StatsSection } from "@/components/sections/features-stats";
import {
  SolutionsSection,
  ErpOverviewSection,
  ProductsPreviewSection,
  IndustriesPreviewSection,
  TestimonialsSection,
  CaseStudiesSection,
  PricingPreviewSection,
  BlogPreviewSection,
} from "@/components/sections/home-sections";
import { CTASection } from "@/components/shared/cta-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <SolutionsSection />
      <ErpOverviewSection />
      <ProductsPreviewSection />
      <IndustriesPreviewSection />
      <TestimonialsSection />
      <CaseStudiesSection />
      <PricingPreviewSection />
      <BlogPreviewSection />
      <CTASection />
    </>
  );
}
