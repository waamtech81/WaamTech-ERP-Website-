"use client";

import dynamic from "next/dynamic";
import { PortalSkeleton } from "@/components/portal/portal-ui";

const CustomSection = dynamic(
  () =>
    import("@/components/portal/portal-custom-erp").then(
      (m) => m.PortalCustomErpSectionView
    ),
  { loading: () => <PortalSkeleton rows={2} />, ssr: false }
);

export default function PortalCustomErpPage() {
  return <CustomSection section="custom-erp" />;
}
