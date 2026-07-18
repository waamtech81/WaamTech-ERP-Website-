"use client";

import { Building2, Package } from "lucide-react";
import { usePortalContext } from "@/components/portal/portal-data-provider";
import { formatPortalDate } from "@/components/portal/use-portal-data";
import { PortalEmptyState, PortalStatusBadge } from "@/components/portal/portal-ui";
import type { PortalBusinessCard } from "@/lib/portal/dashboard";

function BusinessCard({ business }: { business: PortalBusinessCard }) {
  const fields = [
    { label: "Industry", value: business.industry },
    { label: "Category", value: business.category },
    { label: "Business profile", value: business.businessProfile },
    { label: "Product", value: business.product },
    { label: "Plan", value: business.plan },
    { label: "Tenant / workspace", value: business.workspace },
    { label: "Activation", value: formatPortalDate(business.activationDate) },
    { label: "Renewal", value: formatPortalDate(business.renewalDate) },
    { label: "Expiry", value: formatPortalDate(business.expiryDate) },
  ].filter((f) => f.value);

  return (
    <article className="portal-card flex h-full flex-col rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]">
            <Building2 className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold tracking-tight text-[var(--portal-fg)]">
              {business.businessName}
            </h3>
            {business.product ? (
              <p className="mt-1 text-sm text-[var(--portal-muted)]">{business.product}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {business.licenseStatus ? (
            <PortalStatusBadge status={business.licenseStatus} />
          ) : null}
          {business.subscriptionStatus ? (
            <PortalStatusBadge status={business.subscriptionStatus} />
          ) : null}
        </div>
      </div>

      {business.featurePacks.length ? (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--portal-muted)]">
            Feature packs
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {business.featurePacks.map((pack) => (
              <span
                key={pack}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--portal-primary-soft)] px-2.5 py-1 text-xs font-medium text-[var(--portal-primary)]"
              >
                <Package className="h-3 w-3" aria-hidden />
                {pack}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {fields.length ? (
        <dl className="mt-5 grid flex-1 gap-3 sm:grid-cols-2">
          {fields.map((field) => (
            <div
              key={field.label}
              className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-3.5 py-3"
            >
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--portal-muted)]">
                {field.label}
              </dt>
              <dd className="mt-1 text-sm font-medium capitalize text-[var(--portal-fg)]">
                {field.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </article>
  );
}

export function PortalBusinessProfileView({ embedded = false }: { embedded?: boolean }) {
  const { data } = usePortalContext();
  const businesses = data?.businesses ?? [];

  const hasContent = businesses.some(
    (b) =>
      b.businessName ||
      b.product ||
      b.plan ||
      b.industry ||
      b.category ||
      b.licenseStatus ||
      b.subscriptionStatus
  );

  if (!businesses.length || !hasContent) {
    if (embedded) return null;
    return (
      <PortalEmptyState
        title="Profile unavailable"
        description="Business profile fields will show when returned by License Engine."
        icon={Building2}
      />
    );
  }

  return (
    <div className={embedded ? "space-y-4" : "space-y-6"}>
      {embedded ? (
        <div>
          <h3 className="text-sm font-semibold text-[var(--portal-fg)]">Business profiles</h3>
          <p className="mt-1 text-xs text-[var(--portal-muted)]">
            Products, plans, and license status across your workspace.
          </p>
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {businesses.map((business, index) => (
          <BusinessCard
            key={`${business.licenseId || business.subscriptionId || business.businessName}-${index}`}
            business={business}
          />
        ))}
      </div>
    </div>
  );
}
