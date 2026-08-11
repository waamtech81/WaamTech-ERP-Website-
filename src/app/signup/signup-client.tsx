"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { authConfig, getAppLoginUrl, getPortalLoginPath } from "@/lib/auth/config";
import { useLocale } from "@/components/providers/locale-provider";
import {
  COUNTRIES,
  countryFlag,
  formatCountryLabel,
  getCountryByCode,
  mergePhoneWithDialCode,
} from "@/lib/data/countries";
import { getIcon } from "@/lib/icons";
import {
  normalizeCustomErpBillingCycle,
} from "@/lib/commercial/custom-erp-billing";
import {
  parseBillingCycle,
  readPlanSelection,
  savePlanSelection,
} from "@/lib/commercial/plan-selection";
import type { BillingCycle, CatalogPlan, CatalogProduct } from "@/lib/commercial/types";
import { cn } from "@/lib/utils";
import { formatDisplayDate } from "@/lib/format-display-datetime";
import {
  useCatalogBusinessCategories,
  useCatalogIndustries,
  useCatalogPlans,
  useCatalogProducts,
} from "@/hooks/use-commercial";
import {
  CatalogLoadingInline,
  CatalogSelectError,
} from "@/components/commercial/catalog-states";
import { MobileAppProfileCallout } from "@/components/shared/mobile-app-callout";
import { PosProfileCallout } from "@/components/shared/pos-profile-callout";
import { apiMessageFromJson, friendlyNetworkError } from "@/lib/network/errors";
import {
  ensureRecaptchaReady,
  executeRecaptcha,
  hasRecaptchaV3SiteKey,
  RecaptchaV3,
  useRecaptchaReady,
} from "@/components/security/recaptcha-v3";
import {
  industryDisplayIcon,
  mapCatalogPlanToPricingPlan,
  planCtaLabel,
  resolveCyclePrice,
} from "@/lib/commercial/mappers";
import { getCategoryAccessHints } from "@/lib/data/mobile-app";
import {
  normalizePermalinkSlug,
} from "@/lib/signup/permalinks";
import { CustomErpPackageSummary } from "@/components/commercial/custom-erp-package-summary";
import { shouldShowCheckoutCouponField } from "@/lib/commercial/coupon-visibility";
import {
  clearCustomErpPackage,
  loadCustomErpPackage,
  type CustomErpPackagePayload,
  type SignupPackageType,
} from "@/lib/signup/custom-package";
import {
  resolveSignupCommercialMode,
  signupModeCtaLabel,
} from "@/lib/signup/commercial-mode";
import { buildCustomSignupPricingSummary } from "@/lib/signup/custom-pricing-summary";
import { saveCheckoutSessionToken } from "@/lib/portal/checkout-session";
import { markPortalEmailDeliveryNoticePending } from "@/lib/portal/email-delivery-notice";
import {
  canStartOtpVerifySubmit,
  isRegistrationAlreadyCompletedResponse,
  shouldRecoverCompletedRegistrationAfterFailure,
  shouldRetryCaptchaAfterVerifyFailure,
} from "@/lib/signup/otp-verify-submit";

export type SignUpClientProps = {
  /** Pre-resolved Engine UUIDs from server slug lookup (never from public URL). */
  resolvedIndustryId?: string;
  resolvedCategoryId?: string;
  /** @deprecated Profile is auto-resolved by License Engine from Category. */
  resolvedProfileId?: string;
  industrySlug?: string;
  categorySlug?: string;
  /** True when server already validated permalink slugs via License Engine. */
  hierarchyValidated?: boolean;
};

type StrengthRule = { id: string; label: string; test: (v: string) => boolean };

const passwordRules: StrengthRule[] = [
  { id: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { id: "lower", label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { id: "upper", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { id: "number", label: "One number", test: (v) => /\d/.test(v) },
  { id: "special", label: "One special character (!@#$…)", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const SIGNUP_DRAFT_KEY = "waamto-signup-draft:v1";

type SignupDraft = {
  name?: string;
  email?: string;
  companyName?: string;
  phone?: string;
  phoneDialCode?: string;
  countryCode?: string;
  productId?: string;
  productSlug?: string;
  planId?: string;
  planSlug?: string;
  billingCycle?: BillingCycle | "";
  industryId?: string;
  categoryId?: string;
  agree?: boolean;
  marketingOptIn?: boolean;
  /** Pending OTP session — required so Resend OTP survives refresh/back. */
  registrationId?: string;
  otpStep?: boolean;
  maskedEmail?: string;
  signupModeHint?: "trial" | "paid" | null;
};

function clearSignupDraft() {
  try {
    window.sessionStorage.removeItem(SIGNUP_DRAFT_KEY);
  } catch {
    // Storage may be unavailable in a privacy-restricted browser.
  }
}

function FancySelect({
  label,
  placeholder,
  valueLabel,
  open,
  onToggle,
  onClose,
  children,
  disabled,
  required,
  searchPlaceholder,
  searchValue,
  onSearchChange,
}: {
  label: string;
  placeholder: string;
  valueLabel?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  required?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div className="space-y-2" ref={rootRef}>
      <Label>
        {label}
        {required ? <span className="text-rose-600"> *</span> : null}
      </Label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={onToggle}
          className={cn(
            "flex h-12 w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 text-left text-sm shadow-sm transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            open ? "border-primary ring-2 ring-primary/15" : "border-border hover:border-primary/30",
            disabled && "cursor-not-allowed opacity-60"
          )}
          aria-expanded={open}
        >
          <span
            className={cn(
              "min-w-0 flex-1 truncate",
              valueLabel ? "text-foreground font-medium" : "text-muted-foreground"
            )}
          >
            {valueLabel || placeholder}
          </span>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          />
        </button>
        {open ? (
          <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-40 overflow-hidden rounded-xl border border-border bg-white shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
            {onSearchChange ? (
              <div className="border-b border-border p-2">
                <Input
                  value={searchValue || ""}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder || "Search..."}
                  className="h-9"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ) : null}
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Shown on predefined / direct signup — link to Custom ERP Builder. */
function CustomErpSignupPrompt({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div
        className={cn(
          "flex flex-col gap-2 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-sky-50/80 px-3 py-3 sm:flex-row sm:items-center sm:justify-between",
          className
        )}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#0b1f3a]">Need your own custom ERP?</p>
          <p className="text-xs text-muted-foreground">Choose modules only — live pricing.</p>
        </div>
        <Button asChild size="sm" variant="outline" className="shrink-0 rounded-full border-primary/30">
          <Link href="/build-your-own-erp">Build your own ERP →</Link>
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary via-[#1a4a8a] to-[#0b1f3a] p-5 text-white shadow-[0_12px_40px_rgba(15,23,42,0.18)] transition-shadow hover:shadow-[0_16px_48px_rgba(15,23,42,0.24)] md:p-6",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-sky-400/20 blur-2xl"
        aria-hidden
      />

      <div className="relative flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white shadow-inner ring-1 ring-white/20">
          <Sparkles className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-200/90">
            Custom ERP Builder
          </p>
          <p className="mt-1 text-lg font-bold leading-snug tracking-tight text-white">
            Need your own custom ERP?
          </p>
        </div>
      </div>

      <p className="relative mt-3 text-sm leading-relaxed text-white/85">
        Skip fixed plans — choose only the modules, feature packs, and limits your business
        needs, then come back here to sign up.
      </p>

      <ul className="relative mt-3 space-y-1.5 text-xs text-white/80 sm:text-sm">
        {[
          "See live price as you configure",
          "Industry + module recommendations",
          "Pay only for what you select",
        ].map((item) => (
          <li key={item} className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 shrink-0 text-sky-300" aria-hidden />
            {item}
          </li>
        ))}
      </ul>

      <Button
        asChild
        size="lg"
        className="relative mt-5 w-full cursor-pointer rounded-full border-0 bg-white px-5 py-6 text-sm font-bold text-[#0b1f3a] shadow-md transition-all hover:bg-sky-50 hover:shadow-lg group-hover:scale-[1.01] sm:text-base"
      >
        <Link href="/build-your-own-erp" className="inline-flex items-center justify-center gap-2">
          Build your own ERP
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </Button>
    </div>
  );
}

function SignUpForm({
  resolvedIndustryId = "",
  resolvedCategoryId = "",
  industrySlug: industrySlugProp = "",
  categorySlug: categorySlugProp = "",
  hierarchyValidated = false,
}: SignUpClientProps) {
  const captcha = useRecaptchaReady();
  const searchParams = useSearchParams();
  const { country: detectedCountry, formatPrice } = useLocale();

  // Display-only slugs from server props — never bind commercial IDs from path params
  const industrySlug = normalizePermalinkSlug(industrySlugProp);
  const categorySlug = normalizePermalinkSlug(categorySlugProp);
  const permalinkReady =
    !hierarchyValidated ||
    (Boolean(resolvedIndustryId) &&
      (!categorySlug || Boolean(resolvedCategoryId)));

  // Query hints only — plan/product/price always reloaded from License Engine
  const defaultProductSlug = searchParams.get("product") || "";
  const defaultPlanSlug = searchParams.get("plan") || "";
  const defaultPlanId = searchParams.get("plan_id") || "";
  const defaultBillingCycle = searchParams.get("billing_cycle") || "";
  const defaultPackageType: SignupPackageType =
    searchParams.get("package_type")?.toLowerCase() === "custom" ? "custom" : "predefined";

  const [packageType, setPackageType] = useState<SignupPackageType>(defaultPackageType);
  const [customPackage, setCustomPackage] = useState<CustomErpPackagePayload | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneDialCode, setPhoneDialCode] = useState(() => {
    const detected =
      detectedCountry && getCountryByCode(detectedCountry)
        ? detectedCountry.toUpperCase()
        : "";
    return detected || "PK";
  });
  const [phoneDialSearch, setPhoneDialSearch] = useState("");
  const [countryCode, setCountryCode] = useState(() =>
    detectedCountry && getCountryByCode(detectedCountry) ? detectedCountry.toUpperCase() : ""
  );
  const [countrySearch, setCountrySearch] = useState("");
  const [productId, setProductId] = useState("");
  const [productSlug, setProductSlug] = useState(defaultProductSlug);
  const [planId, setPlanId] = useState(defaultPlanId);
  const [planSlug, setPlanSlug] = useState(defaultPlanSlug);
  const [billingCycle, setBillingCycle] = useState<BillingCycle | "">(
    () => parseBillingCycle(defaultBillingCycle) || ""
  );
  const [enginePlan, setEnginePlan] = useState<CatalogPlan | null>(null);
  const [engineProduct, setEngineProduct] = useState<CatalogProduct | null>(null);
  const [planLookupLoading, setPlanLookupLoading] = useState(Boolean(defaultPlanId));
  const [planLookupError, setPlanLookupError] = useState("");
  const [industryId, setIndustryId] = useState(resolvedIndustryId);
  const [categoryId, setCategoryId] = useState(resolvedCategoryId);
  const [agree, setAgree] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [trialReady, setTrialReady] = useState(false);
  const [paidCheckoutReady, setPaidCheckoutReady] = useState(false);
  const [postVerifyRedirect, setPostVerifyRedirect] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [registrationId, setRegistrationId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [username, setUsername] = useState("");
  const [trialEndsAt, setTrialEndsAt] = useState("");
  const [signupModeHint, setSignupModeHint] = useState<"trial" | "paid" | "">(
    ""
  );
  const [honeypot, setHoneypot] = useState("");
  const [formStartedAt] = useState(() => Date.now());
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [openSelect, setOpenSelect] = useState<
    | "country"
    | "phoneDial"
    | "product"
    | "plan"
    | "industry"
    | "category"
    | null
  >(null);
  const countryTouchedRef = useRef(false);
  const phoneDialTouchedRef = useRef(false);
  /** Sync guard — React `loading` alone cannot block rapid double-submit. */
  const otpVerifyInFlightRef = useRef(false);
  const otpVerifyCompletedRef = useRef(false);
  const [otpVerifyLocked, setOtpVerifyLocked] = useState(false);

  const productsQuery = useCatalogProducts();
  const plansQuery = useCatalogPlans(productSlug || null);
  const industriesQuery = useCatalogIndustries();
  const categoriesQuery = useCatalogBusinessCategories(industryId || null);

  // Custom mode when arriving from the builder (`?package_type=custom`) OR when a
  // saved Custom ERP package still exists (kept until OTP / signup finalize).
  useEffect(() => {
    const fromUrl = searchParams.get("package_type")?.toLowerCase() === "custom";
    const saved = loadCustomErpPackage();
    if (fromUrl || saved) {
      setPackageType("custom");
      if (saved) {
        setCustomPackage(saved);
        setBillingCycle(normalizeCustomErpBillingCycle(saved.billing_cycle));
      } else {
        const fromQuery = parseBillingCycle(searchParams.get("billing_cycle"));
        setBillingCycle(normalizeCustomErpBillingCycle(fromQuery));
      }
      return;
    }
    setPackageType("predefined");
  }, [searchParams]);

  // Keep an unfinished signup in this browser tab across refresh/back navigation.
  // Passwords are deliberately never persisted in browser storage.
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(SIGNUP_DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as SignupDraft;
      if (!draft || typeof draft !== "object") return;

      if (typeof draft.name === "string") setName(draft.name);
      if (typeof draft.email === "string") setEmail(draft.email);
      if (typeof draft.companyName === "string") setCompanyName(draft.companyName);
      if (typeof draft.phone === "string") setPhone(draft.phone);
      if (typeof draft.phoneDialCode === "string") {
        setPhoneDialCode(draft.phoneDialCode);
        phoneDialTouchedRef.current = true;
      }
      if (typeof draft.countryCode === "string") {
        setCountryCode(draft.countryCode);
        countryTouchedRef.current = true;
      }
      if (typeof draft.productId === "string") setProductId(draft.productId);
      if (typeof draft.productSlug === "string") setProductSlug(draft.productSlug);
      if (typeof draft.planId === "string") setPlanId(draft.planId);
      if (typeof draft.planSlug === "string") setPlanSlug(draft.planSlug);
      if (
        draft.billingCycle === "" ||
        draft.billingCycle === "monthly" ||
        draft.billingCycle === "yearly" ||
        draft.billingCycle === "lifetime"
      ) {
        const customSession = loadCustomErpPackage();
        if (customSession || searchParams.get("package_type")?.toLowerCase() === "custom") {
          setBillingCycle(
            draft.billingCycle === ""
              ? normalizeCustomErpBillingCycle(customSession?.billing_cycle)
              : normalizeCustomErpBillingCycle(draft.billingCycle)
          );
        } else {
          setBillingCycle(draft.billingCycle);
        }
      }
      if (typeof draft.industryId === "string") setIndustryId(draft.industryId);
      if (typeof draft.categoryId === "string") setCategoryId(draft.categoryId);
      if (typeof draft.agree === "boolean") setAgree(draft.agree);
      if (typeof draft.marketingOptIn === "boolean") setMarketingOptIn(draft.marketingOptIn);
      const restoredRegistrationId =
        typeof draft.registrationId === "string" ? draft.registrationId.trim() : "";
      if (restoredRegistrationId && draft.otpStep === true) {
        setRegistrationId(restoredRegistrationId);
        setOtpStep(true);
        if (typeof draft.maskedEmail === "string" && draft.maskedEmail.trim()) {
          setMaskedEmail(draft.maskedEmail);
        } else if (typeof draft.email === "string" && draft.email.trim()) {
          setMaskedEmail(draft.email);
        }
        if (draft.signupModeHint === "paid" || draft.signupModeHint === "trial") {
          setSignupModeHint(draft.signupModeHint);
        }
      }
    } catch {
      window.sessionStorage.removeItem(SIGNUP_DRAFT_KEY);
    } finally {
      setDraftHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!draftHydrated) return;
    const draft: SignupDraft = {
      name,
      email,
      companyName,
      phone,
      phoneDialCode,
      countryCode,
      productId,
      productSlug,
      planId,
      planSlug,
      billingCycle,
      industryId,
      categoryId,
      agree,
      marketingOptIn,
      registrationId: otpStep ? registrationId || undefined : undefined,
      otpStep: otpStep || undefined,
      maskedEmail: otpStep ? maskedEmail || undefined : undefined,
      signupModeHint:
        otpStep && (signupModeHint === "trial" || signupModeHint === "paid")
          ? signupModeHint
          : undefined,
    };
    try {
      window.sessionStorage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Storage may be unavailable in a privacy-restricted browser.
    }
  }, [
    agree,
    billingCycle,
    categoryId,
    companyName,
    countryCode,
    draftHydrated,
    email,
    industryId,
    marketingOptIn,
    maskedEmail,
    name,
    otpStep,
    phone,
    phoneDialCode,
    planId,
    planSlug,
    productId,
    productSlug,
    registrationId,
    signupModeHint,
  ]);

  const sortedProducts = useMemo(
    () =>
      [...productsQuery.data].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      ),
    [productsQuery.data]
  );
  const sortedIndustries = useMemo(
    () =>
      [...industriesQuery.data].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      ),
    [industriesQuery.data]
  );
  const sortedCategories = useMemo(
    () =>
      [...categoriesQuery.data].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      ),
    [categoriesQuery.data]
  );

  const countryOptions = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dialCode.replace(/\s/g, "").includes(q.replace(/\s/g, ""))
    );
  }, [countrySearch]);
  const phoneDialOptions = useMemo(() => {
    const q = phoneDialSearch.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dialCode.replace(/\s/g, "").includes(q.replace(/\s/g, ""))
    );
  }, [phoneDialSearch]);
  const selectedCountry = useMemo(
    () => (countryCode ? getCountryByCode(countryCode) : undefined),
    [countryCode]
  );
  const selectedPhoneDial = useMemo(
    () => getCountryByCode(phoneDialCode) || getCountryByCode("PK"),
    [phoneDialCode]
  );

  const signupPlans = useMemo(
    () =>
      plansQuery.data.filter(
        (p) =>
          !p.contact_sales &&
          p.pricing_type !== "custom" &&
          String(p.tier || p.slug).toLowerCase() !== "enterprise" &&
          !String(p.slug || "").toLowerCase().includes("custom-erp")
      ),
    [plansQuery.data]
  );

  const isCustomPackage = packageType === "custom";

  const selectedProduct = useMemo(
    () =>
      engineProduct ||
      productsQuery.data.find((p) => p.id === productId || p.slug === productSlug),
    [productsQuery.data, productId, productSlug, engineProduct]
  );
  const selectedPlan = useMemo(
    () =>
      enginePlan ||
      signupPlans.find((p) => p.id === planId || p.slug === planSlug) ||
      null,
    [signupPlans, planId, planSlug, enginePlan]
  );

  const signupMode = useMemo(
    () =>
      resolveSignupCommercialMode({
        packageType: isCustomPackage ? "custom" : "predefined",
        plan: selectedPlan,
        billingCycle: isCustomPackage
          ? customPackage?.billing_cycle || billingCycle || null
          : billingCycle || null,
      }),
    [
      isCustomPackage,
      selectedPlan,
      billingCycle,
      customPackage?.billing_cycle,
    ]
  );

  const signupCtaLabel = useMemo(
    () => signupModeCtaLabel(signupMode, selectedPlan),
    [signupMode, selectedPlan]
  );

  const isPaidSignup = signupMode === "paid" || signupModeHint === "paid";

  const enginePricing = useMemo(() => {
    if (!selectedPlan) return null;
    const mapped = mapCatalogPlanToPricingPlan(selectedPlan);
    const yearly = billingCycle === "yearly";
    return resolveCyclePrice(mapped, yearly);
  }, [selectedPlan, billingCycle]);

  // License Engine SSOT — resolve plan_id from URL (never trust client prices)
  useEffect(() => {
    if (!defaultPlanId) {
      setPlanLookupLoading(false);
      return;
    }
    let cancelled = false;
    setPlanLookupLoading(true);
    setPlanLookupError("");

    (async () => {
      try {
        const res = await fetch(
          `/api/commercial/plans/${encodeURIComponent(defaultPlanId)}`,
          { headers: { Accept: "application/json" }, cache: "no-store" }
        );
        const json = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          message?: string;
          code?: string;
          data?: { plan?: CatalogPlan; product?: CatalogProduct };
        };
        if (cancelled) return;
        if (!res.ok || !json.success || !json.data?.plan || !json.data?.product) {
          setEnginePlan(null);
          setEngineProduct(null);
          setPlanLookupError(
            json.message ||
              (json.code === "PLAN_EXPIRED"
                ? "This plan offer has expired."
                : json.code === "PLAN_DISABLED" || json.code === "PRODUCT_DISABLED"
                  ? "This plan is not available for signup."
                  : "Invalid or missing plan. Please choose a plan again.")
          );
          return;
        }
        const plan = json.data.plan;
        const product = json.data.product;
        setEnginePlan(plan);
        setEngineProduct(product);
        setPlanId(plan.id);
        setPlanSlug(plan.slug);
        setProductId(product.id);
        setProductSlug(product.slug);
        if (!billingCycle) {
          const fromPlan = parseBillingCycle(plan.billing_cycle || plan.plan_type);
          if (fromPlan && fromPlan !== "lifetime") setBillingCycle(fromPlan);
          else if (plan.lifetime_price != null) setBillingCycle("lifetime");
          else setBillingCycle("monthly");
        }
      } catch (err) {
        if (!cancelled) {
          setPlanLookupError(
            friendlyNetworkError(err, "Could not load plan details. Please try again.")
          );
        }
      } finally {
        if (!cancelled) setPlanLookupLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Resolve once from plan_id query — billingCycle seed is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultPlanId]);

  useEffect(() => {
    const stored = readPlanSelection();
    if (!stored) return;
    if (!planId && stored.planId) setPlanId(stored.planId);
    if (!planSlug && stored.plan) setPlanSlug(stored.plan);
    if (!productSlug && stored.productSlug) setProductSlug(stored.productSlug);
    if (!billingCycle && stored.billingCycle) setBillingCycle(stored.billingCycle);
    // Hydrate once from pricing selection — do not re-run on every field change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedPlan) return;
    if (billingCycle) return;
    const fromPlan = parseBillingCycle(
      selectedPlan.billing_cycle || selectedPlan.plan_type
    );
    if (fromPlan && fromPlan !== "lifetime") {
      setBillingCycle(fromPlan);
    } else if (selectedPlan.lifetime_price != null) {
      setBillingCycle("lifetime");
    } else {
      setBillingCycle("monthly");
    }
  }, [selectedPlan, billingCycle]);

  useEffect(() => {
    if (!planId || !billingCycle) return;
    savePlanSelection({
      planId,
      plan: planSlug || selectedPlan?.slug || planId,
      productSlug: productSlug || undefined,
      billingCycle,
    });
  }, [planId, planSlug, productSlug, billingCycle, selectedPlan?.slug]);

  const selectedIndustry = useMemo(
    () => industriesQuery.data.find((i) => i.id === industryId),
    [industriesQuery.data, industryId]
  );
  const selectedCategory = useMemo(
    () => categoriesQuery.data.find((c) => c.id === categoryId),
    [categoriesQuery.data, categoryId]
  );

  useEffect(() => {
    if (!productsQuery.data.length) return;
    if (productId && productsQuery.data.some((p) => p.id === productId)) return;
    const fromSlug = defaultProductSlug
      ? productsQuery.data.find((p) => p.slug === defaultProductSlug)
      : null;
    const next = fromSlug || productsQuery.data[0];
    if (next) {
      setProductId(next.id);
      setProductSlug(next.slug);
    }
  }, [productsQuery.data, productId, defaultProductSlug]);

  useEffect(() => {
    if (!signupPlans.length) return;
    if (planId && signupPlans.some((p) => p.id === planId)) return;

    const fromSlug = planSlug
      ? signupPlans.find((p) => p.slug === planSlug)
      : null;

    const intent = String(
      searchParams.get("intent") || defaultPlanSlug || planSlug || ""
    ).toLowerCase();

    const byIntent =
      intent.includes("lifetime") || intent === "lifetime"
        ? signupPlans.find(
            (p) =>
              p.lifetime_price != null ||
              p.slug === "lifetime" ||
              p.tier === "lifetime" ||
              p.plan_type === "lifetime"
          )
        : intent.includes("trial") || intent === "free" || intent === "starter"
          ? signupPlans.find(
              (p) =>
                p.has_free_trial ||
                p.slug === "starter" ||
                p.tier === "starter" ||
                p.pricing_type === "trial"
            )
          : intent.includes("business")
            ? signupPlans.find((p) => p.slug === "business" || p.tier === "business")
            : null;

    const business = signupPlans.find(
      (p) => p.slug === "business" || p.tier === "business"
    );
    const next = fromSlug || byIntent || business || signupPlans[0];
    if (next) {
      setPlanId(next.id);
      setPlanSlug(next.slug);
    }
  }, [signupPlans, planId, planSlug, defaultPlanSlug, searchParams]);

  const ruleStatus = useMemo(
    () => passwordRules.map((r) => ({ ...r, ok: r.test(password) })),
    [password]
  );
  const passwordStrong = ruleStatus.every((r) => r.ok);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  // Seed from server-resolved UUIDs (slug routes) — never from public URL text
  useEffect(() => {
    if (resolvedIndustryId) setIndustryId(resolvedIndustryId);
  }, [resolvedIndustryId]);
  useEffect(() => {
    if (resolvedCategoryId) setCategoryId(resolvedCategoryId);
  }, [resolvedCategoryId]);

  // Only clear after Engine list has loaded — never wipe during empty loading state
  useEffect(() => {
    if (!industryId || !categoryId) return;
    if (categoriesQuery.loading) return;
    if (categoriesQuery.error) return;
    if (!categoriesQuery.data.some((c) => c.id === categoryId)) {
      setCategoryId("");
    }
  }, [
    categoriesQuery.data,
    categoriesQuery.loading,
    categoriesQuery.error,
    categoryId,
    industryId,
  ]);

  useEffect(() => {
    const detected = detectedCountry?.toUpperCase();
    if (!detected || !getCountryByCode(detected)) return;
    if (!countryTouchedRef.current) setCountryCode(detected);
    if (!phoneDialTouchedRef.current) setPhoneDialCode(detected);
  }, [detectedCountry]);

  useEffect(() => {
    if (openSelect !== "phoneDial") return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("[data-phone-dial-root]")) return;
      setOpenSelect(null);
      setPhoneDialSearch("");
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenSelect(null);
        setPhoneDialSearch("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [openSelect]);

  function onProductSelect(nextId: string, nextSlug: string) {
    setProductId(nextId);
    setProductSlug(nextSlug);
    setPlanId("");
    setPlanSlug("");
    setEnginePlan(null);
    setEngineProduct(null);
    setPlanLookupError("");
    setOpenSelect("plan");
  }

  function onIndustrySelect(nextIndustryId: string) {
    setIndustryId(nextIndustryId);
    setCategoryId("");
    setOpenSelect("category");
  }

  function onCategorySelect(nextCategoryId: string) {
    setCategoryId(nextCategoryId);
    setOpenSelect(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isCustomPackage && !permalinkReady) {
      setError("This signup link is invalid. Please start again from pricing.");
      return;
    }

    if (!agree) {
      setError("Please accept the Terms and Privacy Policy.");
      return;
    }

    if (!companyName.trim()) {
      setError("Please enter your company / workspace name.");
      return;
    }

    if (!countryCode) {
      setError("Please select your country.");
      return;
    }

    if (isCustomPackage) {
      if (!customPackage?.selected_modules?.length) {
        setError(
          "Assemble your package on Build your own custom ERP first, then continue to signup."
        );
        return;
      }
    } else {
      if (!productId) {
        setError("Please choose a product.");
        return;
      }

      if (!planId) {
        setError("Please choose a plan.");
        return;
      }

      if (!industryId) {
        setError("Please choose an industry.");
        return;
      }

      if (!categoryId) {
        setError("Please select a business category.");
        return;
      }
    }

    if (!phone.trim()) {
      setError("Please enter a phone number.");
      return;
    }

    const fullPhone = mergePhoneWithDialCode(selectedPhoneDial?.dialCode, phone);
    if (!fullPhone) {
      setError("Please enter a phone number.");
      return;
    }

    if (!passwordStrong) {
      setError("Please meet all password requirements.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    setLoading(true);
    try {
      let captchaToken: string | null = null;
      if (hasRecaptchaV3SiteKey()) {
        captchaToken = await executeRecaptcha("portal_signup");
        if (!captchaToken) {
          setError("Captcha failed to load. Please refresh and try again.");
          setLoading(false);
          return;
        }
      }

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          phone: fullPhone,
          phone_local: phone.trim(),
          phone_dial_code: selectedPhoneDial?.dialCode || undefined,
          phone_country_code: selectedPhoneDial?.code || phoneDialCode || undefined,
          company_name: companyName,
          country: countryCode,
          package_type: isCustomPackage ? "custom" : "predefined",
          ...(isCustomPackage && customPackage
            ? {
                product_slug: customPackage.product_slug || "waamto-erp",
                selected_modules: customPackage.selected_modules,
                dependency_modules: customPackage.dependency_modules,
                recommended_modules: customPackage.recommended_modules,
                billing_cycle: customPackage.billing_cycle,
                monthly_price: customPackage.monthly_price,
                yearly_price: customPackage.yearly_price,
                lifetime_price: customPackage.lifetime_price,
                estimated_total:
                  customPackage.money?.grand_total ?? customPackage.estimated_total,
                pricing_summary: buildCustomSignupPricingSummary({
                  pkg: customPackage,
                  clientGrandTotal:
                    customPackage.money?.grand_total ?? customPackage.estimated_total,
                }),
                selected_module_count: customPackage.selected_module_count,
                ...(customPackage.industry_id
                  ? { industry_id: customPackage.industry_id }
                  : {}),
                ...(customPackage.industry_name
                  ? { industry_name: customPackage.industry_name }
                  : {}),
                ...(customPackage.category_id
                  ? { category_id: customPackage.category_id }
                  : {}),
                ...(customPackage.category_name
                  ? { category_name: customPackage.category_name }
                  : {}),
                ...(customPackage.feature_packs?.length
                  ? { feature_packs: customPackage.feature_packs }
                  : {}),
                ...(customPackage.feature_packs?.length
                  ? {
                      selected_feature_packs: customPackage.feature_packs.map((p) => p.code),
                    }
                  : {}),
                ...(customPackage.dependency_modules?.length
                  ? { required_modules: customPackage.dependency_modules }
                  : {}),
                ...(customPackage.tenant_limits
                  ? {
                      tenant_limits: customPackage.tenant_limits,
                      user_limit: customPackage.tenant_limits.users,
                      company_limit: customPackage.tenant_limits.companies,
                      branch_limit: customPackage.tenant_limits.branches,
                      warehouse_limit: customPackage.tenant_limits.warehouses,
                    }
                  : {}),
                ...(customPackage.discount_code || customPackage.money?.discount_code
                  ? {
                      discount_code:
                        customPackage.discount_code ||
                        customPackage.money?.discount_code ||
                        undefined,
                    }
                  : {}),
              }
            : {
                // Commercial: IDs only — Engine is SSOT for product/price/modules/limits
                plan_id: planId,
                industry_id: industryId,
                category_id: categoryId,
                ...(billingCycle ? { billing_cycle: billingCycle } : {}),
              }),
          marketing_opt_in: marketingOptIn,
          website: honeypot,
          _t: formStartedAt,
          ...(captchaToken ? { captcha_token: captchaToken } : {}),
        }),
      });
      let json: {
        success?: boolean;
        message?: string;
        requiresOtp?: boolean;
        requiresVerification?: boolean;
        data?: {
          email?: string;
          registrationId?: string;
          signup_mode?: string;
        };
      };
      try {
        json = await res.json();
      } catch {
        setError(
          res.status >= 500
            ? "Signup service temporarily unavailable. Please try again."
            : friendlyNetworkError(null, "Something went wrong. Please try again.")
        );
        setLoading(false);
        return;
      }

      if (!json.success) {
        setError(apiMessageFromJson(json, "Signup failed."));
        setLoading(false);
        return;
      }

      if (json.requiresOtp || json.requiresVerification) {
        const nextRegistrationId = String(json.data?.registrationId || "").trim();
        if (!nextRegistrationId) {
          setError("Could not start the email verification session. Please try signing up again.");
          setLoading(false);
          return;
        }
        setMaskedEmail(json.data?.email || email);
        setRegistrationId(nextRegistrationId);
        setSignupModeHint(
          json.data?.signup_mode === "paid"
            ? "paid"
            : json.data?.signup_mode === "trial"
              ? "trial"
              : signupMode
        );
        setOtpStep(true);
        setSuccess(
          json.message ||
            (signupMode === "paid"
              ? "Enter the verification code sent to your email."
              : "Enter the verification code sent to your email.")
        );
        setLoading(false);
        return;
      }

      clearSignupDraft();
      clearCustomErpPackage();
      setSuccess(json.message || "Account created.");
      setLoading(false);
    } catch (err) {
      setError(friendlyNetworkError(err, "Something went wrong. Please try again."));
      setLoading(false);
    }
  }

  function releaseOtpVerifySubmitLock() {
    if (otpVerifyCompletedRef.current) return;
    otpVerifyInFlightRef.current = false;
    setOtpVerifyLocked(false);
  }

  function lockOtpVerifySubmit() {
    otpVerifyInFlightRef.current = true;
    setOtpVerifyLocked(true);
  }

  function markOtpVerifySubmitCompleted() {
    otpVerifyCompletedRef.current = true;
    otpVerifyInFlightRef.current = true;
    setOtpVerifyLocked(true);
  }

  function finishOtpVerification(json: {
    message?: unknown;
    data?: Record<string, unknown>;
  }) {
    markOtpVerifySubmitCompleted();

    const data = json.data || {};
    setUsername(String(data.username || ""));
    setTrialEndsAt(String(data.trialEndsAt || ""));
    setOtpStep(false);
    clearSignupDraft();
    clearCustomErpPackage();

    const checkoutToken = String(data.checkout_session_token || "").trim();
    const isPaid =
      data.signup_mode === "paid" ||
      data.payment_required === true ||
      Boolean(checkoutToken);

    if (checkoutToken) saveCheckoutSessionToken(checkoutToken);

    let redirectTo =
      String(data.redirectUrl || data.loginUrl || "").trim() ||
      getPortalLoginPath({ email, next: "/portal" });

    if (isPaid && checkoutToken) {
      try {
        const parsed = new URL(redirectTo, window.location.origin);
        if (
          parsed.pathname.startsWith("/portal/checkout") &&
          !parsed.searchParams.get("session")
        ) {
          parsed.searchParams.set("session", checkoutToken);
          if (!parsed.searchParams.get("mode")) {
            parsed.searchParams.set("mode", "signup");
          }
          redirectTo = `${parsed.pathname}?${parsed.searchParams.toString()}`;
        } else if (!parsed.pathname.startsWith("/portal/checkout")) {
          redirectTo = `/portal/checkout?session=${encodeURIComponent(checkoutToken)}&mode=signup`;
        }
      } catch {
        redirectTo = `/portal/checkout?session=${encodeURIComponent(checkoutToken)}&mode=signup`;
      }
    }

    setPostVerifyRedirect(redirectTo);
    setLoading(false);

    if (isPaid) {
      setPaidCheckoutReady(true);
      setSuccess(
        String(json.message || "Email verified. Opening checkout…")
      );
      window.setTimeout(() => {
        window.location.assign(redirectTo);
      }, 1200);
      return;
    }

    setTrialReady(true);
    setSuccess(String(json.message || "Trial activated."));
    markPortalEmailDeliveryNoticePending();
    window.setTimeout(() => {
      window.location.assign(redirectTo);
    }, 3500);
  }

  async function withSignupCaptcha(
    action: string
  ): Promise<{ ok: true; token: string | null } | { ok: false }> {
    if (!hasRecaptchaV3SiteKey()) return { ok: true, token: null };
    let token = await executeRecaptcha(action);
    if (!token) {
      await new Promise((resolve) => window.setTimeout(resolve, 400));
      token = await executeRecaptcha(action);
    }
    if (!token) {
      setError("Captcha failed to load. Please refresh and try again.");
      return { ok: false };
    }
    return { ok: true, token };
  }

  useEffect(() => {
    if (!otpStep || !hasRecaptchaV3SiteKey()) return;
    void ensureRecaptchaReady();
  }, [otpStep]);

  async function onVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!registrationId) {
      setError("Registration session expired. Please start again.");
      return;
    }
    if (!otpCode.trim()) {
      setError("Enter the verification code from your email.");
      return;
    }
    if (
      !canStartOtpVerifySubmit(
        otpVerifyInFlightRef.current,
        otpVerifyCompletedRef.current
      )
    ) {
      return;
    }

    lockOtpVerifySubmit();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      // Must match License Engine expected action: portal_signup_verify_otp
      const firstCaptcha = await withSignupCaptcha("portal_signup_verify_otp");
      if (!firstCaptcha.ok) {
        releaseOtpVerifySubmitLock();
        setLoading(false);
        return;
      }

      const postVerifyOtp = async (captchaToken: string | null) => {
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            registration_id: registrationId,
            otp: otpCode.trim(),
            email,
            ...(captchaToken ? { captcha_token: captchaToken } : {}),
          }),
        });
        const json = await res.json();
        return { res, json };
      };

      let attempt = await postVerifyOtp(firstCaptcha.token);
      if (
        attempt.json?.success === false &&
        shouldRetryCaptchaAfterVerifyFailure(attempt.json, attempt.res.status)
      ) {
        await new Promise((resolve) => window.setTimeout(resolve, 800));
        const secondCaptcha = await withSignupCaptcha("portal_signup_verify_otp");
        if (secondCaptcha.ok) {
          attempt = await postVerifyOtp(secondCaptcha.token);
        }
      }

      // Engine may finish provision after a false CAPTCHA/timeout response
      // (alternate-path token reuse or slow ERP provision). Recover before
      // showing an error — avoids a second Verify click creating another invoice.
      if (
        attempt.json?.success !== true &&
        shouldRecoverCompletedRegistrationAfterFailure(
          attempt.json,
          attempt.res.status
        )
      ) {
        for (let i = 0; i < 8; i += 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 2000));
          const recoverCaptcha = await withSignupCaptcha("portal_signup_verify_otp");
          if (!recoverCaptcha.ok) continue;
          const recoverAttempt = await postVerifyOtp(recoverCaptcha.token);
          if (recoverAttempt.json?.success === true) {
            attempt = recoverAttempt;
            break;
          }
          if (
            isRegistrationAlreadyCompletedResponse(
              recoverAttempt.json,
              recoverAttempt.res.status
            )
          ) {
            attempt = recoverAttempt;
            break;
          }
          if (
            !shouldRecoverCompletedRegistrationAfterFailure(
              recoverAttempt.json,
              recoverAttempt.res.status
            )
          ) {
            attempt = recoverAttempt;
            break;
          }
        }
      }

      const { json, res } = attempt;
      if (
        json?.success !== true &&
        isRegistrationAlreadyCompletedResponse(json, res.status)
      ) {
        finishOtpVerification({
          message: "Your account is ready. Redirecting…",
          data: {
            email,
            redirectUrl: getPortalLoginPath({ email, next: "/portal" }),
          },
        });
        return;
      }

      if (!json.success) {
        setError(apiMessageFromJson(json, "Verification failed."));
        releaseOtpVerifySubmitLock();
        setLoading(false);
        return;
      }

      finishOtpVerification(json);
    } catch (err) {
      setError(friendlyNetworkError(err, "Something went wrong. Please try again."));
      releaseOtpVerifySubmitLock();
      setLoading(false);
    }
  }

  async function onResendOtp() {
    if (!registrationId) {
      setError("Registration session expired. Please start again.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const firstCaptcha = await withSignupCaptcha("portal_signup_resend_otp");
      if (!firstCaptcha.ok) {
        setLoading(false);
        return;
      }

      const postResendOtp = async (captchaToken: string | null) => {
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "resend",
            registration_id: registrationId,
            email,
            ...(captchaToken ? { captcha_token: captchaToken } : {}),
          }),
        });
        const json = await res.json();
        return { res, json };
      };

      let attempt = await postResendOtp(firstCaptcha.token);
      if (
        attempt.json?.success === false &&
        shouldRetryCaptchaAfterVerifyFailure(attempt.json, attempt.res.status)
      ) {
        await new Promise((resolve) => window.setTimeout(resolve, 800));
        const secondCaptcha = await withSignupCaptcha("portal_signup_resend_otp");
        if (secondCaptcha.ok) {
          attempt = await postResendOtp(secondCaptcha.token);
        }
      }

      const { json } = attempt;
      if (!json.success) {
        setError(apiMessageFromJson(json, "Could not resend code."));
      } else {
        setSuccess(json.message || "A new code was sent.");
      }
    } catch (err) {
      setError(friendlyNetworkError(err, "Could not resend code."));
    } finally {
      setLoading(false);
    }
  }

  const captchaLoading = hasRecaptchaV3SiteKey() && captcha.status === "loading";
  const submitBlocked = captchaLoading && !otpStep;

  if (paidCheckoutReady) {
    return (
      <div className="relative min-h-[calc(100vh-4rem)] bg-muted">
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        <div className="container-site relative flex justify-center py-16 lg:py-24">
          <Card className="w-full max-w-lg min-w-0 shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
            <CardContent className="min-w-0 px-6 py-10 text-center sm:px-10">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                <Check className="h-7 w-7" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0b1f3a]">
                Account ready — complete payment
              </h1>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Your portal account is created. Continue to secure checkout to activate your
                license and ERP workspace.
                {username ? (
                  <>
                    {" "}
                    Username: <span className="font-medium text-foreground">{username}</span>.
                  </>
                ) : null}
              </p>
              <div className="mt-6 rounded-2xl border border-border bg-slate-50 px-4 py-4 text-left text-sm text-muted-foreground leading-relaxed">
                <p className="font-medium text-[#0b1f3a] mb-2">What happens next</p>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li>Pay with card, PayPal, or bank transfer</li>
                  <li>Auto-approved payments activate license and ERP immediately</li>
                  <li>Manual payments show as Pending Approval in your portal</li>
                </ul>
              </div>
              <div className="mt-8 flex w-full min-w-0 flex-col gap-3">
                <Button
                  asChild
                  size="lg"
                  className="h-auto min-h-12 w-full min-w-0 whitespace-normal rounded-full px-5 text-center"
                >
                  <a href={postVerifyRedirect || "/portal/checkout?mode=signup"}>
                    Continue to Checkout
                  </a>
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Redirecting to checkout…
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (trialReady) {
    return (
      <div className="relative min-h-[calc(100vh-4rem)] bg-muted">
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        <div className="container-site relative flex justify-center py-16 lg:py-24">
          <Card className="w-full max-w-lg min-w-0 shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
            <CardContent className="min-w-0 px-6 py-10 text-center sm:px-10">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Check className="h-7 w-7" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0b1f3a]">
                Your trial is ready
              </h1>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Welcome to WAAMTO ERP. Your {authConfig.trialDays}-day trial starts now.
                {username ? (
                  <>
                    {" "}
                    Your username is <span className="font-medium text-foreground">{username}</span>.
                  </>
                ) : null}
              </p>
              <div className="mt-6 rounded-2xl border border-border bg-slate-50 px-4 py-4 text-left text-sm text-muted-foreground leading-relaxed">
                <p className="font-medium text-[#0b1f3a] mb-2">Your next steps</p>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li>{authConfig.trialDays}-day full-featured trial</li>
                  {trialEndsAt ? <li>Expires {formatDisplayDate(trialEndsAt)}</li> : null}
                  <li>Open Customer Portal to manage your account</li>
                  <li>Open WAAMTO ERP to start working</li>
                  <li>Check email for your username and login link</li>
                </ul>
              </div>
              <div className="mt-8 flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-stretch">
                <Button
                  asChild
                  size="lg"
                  className="h-auto min-h-12 w-full min-w-0 whitespace-normal rounded-full px-5 text-center sm:flex-1"
                >
                  <a href={getPortalLoginPath({ email, next: "/portal" })}>
                    Continue to Customer Portal
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-auto min-h-12 w-full min-w-0 whitespace-normal rounded-full px-5 text-center sm:flex-1"
                >
                  <a href={getAppLoginUrl({ email, verified: true, registered: true })}>
                    Open WAAMTO ERP
                  </a>
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Redirecting to Customer Portal…
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (otpStep) {
    return (
      <div className="relative min-h-[calc(100vh-4rem)] bg-muted">
        <RecaptchaV3 />
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        <div className="container-site relative flex justify-center py-16 lg:py-24">
          <Card className="w-full max-w-lg shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
            <CardContent className="px-6 py-10 sm:px-10 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Mail className="h-7 w-7" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0b1f3a]">
                Enter verification code
              </h1>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                We sent a 6-digit code to{" "}
                <span className="font-medium text-foreground">{maskedEmail}</span>. Enter it below
                {isPaidSignup
                  ? " to create your account and continue to checkout."
                  : " to activate your trial."}
              </p>
              <form onSubmit={onVerifyOtp} className="mt-8 space-y-4 text-left">
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification code</Label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    placeholder="6-digit code"
                    className="h-12 tracking-[0.35em] text-center text-lg font-semibold"
                    required
                  />
                </div>
                {error ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-black">
                    {error}
                  </div>
                ) : null}
                {success ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {success}
                  </div>
                ) : null}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading || otpVerifyLocked || otpCode.length < 4}
                >
                  {loading || otpVerifyLocked ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : isPaidSignup ? (
                    "Verify & create account"
                  ) : (
                    "Verify & start trial"
                  )}
                </Button>
              </form>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8"
                  disabled={loading || !registrationId}
                  onClick={onResendOtp}
                >
                  Resend code
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  className="rounded-full px-8"
                  onClick={() => {
                    setOtpStep(false);
                    setOtpCode("");
                    setError("");
                    setSuccess("");
                  }}
                >
                  Back to form
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Form continues below
  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-muted">
      <RecaptchaV3 />
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div className="container-site relative grid gap-6 py-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:items-start lg:gap-8 lg:py-10">
        <div className="max-w-xl lg:sticky lg:top-20 lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto lg:pr-1">
          <Badge variant="accent" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            {isPaidSignup
              ? isCustomPackage
                ? "Custom ERP · Account first, then checkout"
                : "Lifetime plan · Account first, then checkout"
              : `${authConfig.trialDays}-day free trial · No card required`}
          </Badge>
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-balance">
            {isPaidSignup
              ? "Create your account to continue"
              : "Create your workspace in minutes"}
          </h1>
          <p className="mt-2 text-sm font-medium tracking-tight text-primary sm:text-base">
            {isPaidSignup
              ? "Verify your email, then complete payment."
              : `No card required · ${authConfig.trialDays}-day free trial`}
          </p>
          <p className="mt-2 sm:mt-3 text-base sm:text-lg text-muted-foreground leading-relaxed text-pretty">
            {isPaidSignup
              ? isCustomPackage
                ? "Confirm your custom ERP package, create your portal account, and continue to secure checkout."
                : "Confirm your plan, industry, and business category — then create your account and continue to checkout."
              : "Choose product, plan, industry, and category — verify email — start your trial workspace."}
          </p>
          <ul
            className={cn(
              "mt-5 sm:mt-6 space-y-2.5 text-sm text-muted-foreground",
              !isCustomPackage && selectedIndustry && selectedCategory ? "lg:hidden" : ""
            )}
          >
            {(isPaidSignup
              ? [
                  "Create your portal account after email verification",
                  "Complete payment to activate license and ERP",
                  "Auto-approved payments activate instantly; bank transfers may need review",
                  "Your purchased configuration appears in the portal after payment",
                ]
              : [
                  `No credit card or payment to start — ${authConfig.trialDays}-day free trial`,
                  "Product, plan, industry & category stay linked from this site",
                  "Responsive web on desktop, tablet & phone",
                  "Enterprise plans use Contact Sales — never fixed pricing",
                ]
            ).map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          {planLookupError ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-black">
              {planLookupError}{" "}
              <Link href="/pricing" className="font-medium underline">
                View pricing
              </Link>
            </div>
          ) : null}
          {!permalinkReady ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-black">
              This signup link is invalid or expired.{" "}
              <Link href="/pricing" className="font-medium underline">
                View pricing
              </Link>
            </div>
          ) : null}
          {planLookupLoading ? (
            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading your plan…
            </div>
          ) : null}

          {/* Desktop left — Build your own custom ERP summary OR selection + POS/Mobile */}
          {isCustomPackage ? (
            <div className="mt-6 sm:mt-8 space-y-3 hidden lg:block">
              {customPackage ? (
                <CustomErpPackageSummary
                  package={customPackage}
                  readOnly
                  compact
                  showEditLink
                  hideCoupon={
                    !shouldShowCheckoutCouponField({
                      journey: "custom_erp",
                      phase: "first_purchase",
                    })
                  }
                />
              ) : (
                <div className="rounded-2xl border-2 border-sky-400 bg-sky-50 p-4 md:p-5 text-sm">
                  <p className="text-base font-bold text-sky-800">
                    Build your own custom ERP
                  </p>
                  <p className="mt-1 text-sky-900/80">
                    No custom package selected yet. Assemble modules first, then continue to signup.
                  </p>
                  <Button asChild className="mt-3 cursor-pointer rounded-full" size="sm">
                    <Link href="/build-your-own-erp?edit=1">Build your own custom ERP</Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              {selectedIndustry && selectedCategory ? (
            <div className="mt-4 sm:mt-5 hidden lg:block">
              <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                {selectedProduct && selectedPlan ? (
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Your selection
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-[#0b1f3a] leading-snug">
                      {selectedProduct.name} · {selectedPlan.name}
                      {billingCycle ? ` · ${billingCycle}` : ""}
                    </p>
                    {enginePricing?.price != null ? (
                      <p className="mt-1.5 text-xs text-[#0b1f3a]">
                        {enginePricing.originalPrice != null &&
                        enginePricing.originalPrice > enginePricing.price ? (
                          <span className="mr-1.5 text-muted-foreground line-through">
                            {formatPrice(enginePricing.originalPrice)}
                          </span>
                        ) : null}
                        <span className="font-semibold">{formatPrice(enginePricing.price)}</span>
                        <span className="text-muted-foreground"> {enginePricing.unitLabel}</span>
                        {enginePricing.savings != null && enginePricing.savings > 0 ? (
                          <span className="ml-1.5 text-emerald-700">
                            Save {formatPrice(enginePricing.savings)}
                          </span>
                        ) : enginePricing.discountPercent ? (
                          <span className="ml-1.5 text-emerald-700">
                            {enginePricing.discountPercent}% off
                          </span>
                        ) : null}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selectedIndustry.name} → {selectedCategory.name}
                    </p>
                  </div>
                ) : (
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Selected category
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-[#0b1f3a]">
                      {selectedIndustry.name}
                      <span className="mx-1.5 text-muted-foreground font-normal">→</span>
                      {selectedCategory.name}
                    </p>
                  </div>
                )}
                <div className="space-y-2 bg-muted/20 p-3">
                  <PosProfileCallout
                    compact
                    categoryName={selectedCategory.name}
                    posRequirement={
                      selectedCategory.pos_requirement ?? selectedCategory.pos_mode
                    }
                    className="rounded-xl p-3 md:p-3"
                  />
                  <MobileAppProfileCallout
                    compact
                    categoryCode={selectedCategory.code}
                    categorySlug={selectedCategory.slug}
                    industryCode={selectedIndustry.code}
                    industrySlug={selectedIndustry.slug}
                    industryName={selectedCategory.name}
                    mobileRequirement={
                      selectedCategory.mobile_requirement ?? selectedCategory.mobile_mode
                    }
                    className="rounded-xl p-3 md:p-3"
                  />
                </div>
                <div className="border-t border-border bg-white p-3">
                  <CustomErpSignupPrompt compact />
                </div>
              </div>
            </div>
              ) : (
                <CustomErpSignupPrompt className="mt-4 sm:mt-5 hidden lg:block" />
              )}
            </>
          )}
        </div>

        <Card className="mx-auto w-full max-w-2xl shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl">Sign up</CardTitle>
            <CardDescription>
              {isPaidSignup
                ? "Create account · verify email · continue to checkout"
                : "Start free · verify email · open your workspace"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isCustomPackage ? (
              <div className="mb-5 space-y-3 lg:hidden">
                {customPackage ? (
                  <CustomErpPackageSummary
                    package={customPackage}
                    readOnly
                    compact
                    showEditLink
                    hideCoupon={
                      !shouldShowCheckoutCouponField({
                        journey: "custom_erp",
                        phase: "first_purchase",
                      })
                    }
                  />
                ) : (
                  <div className="rounded-2xl border-2 border-sky-400 bg-sky-50 p-4 text-sm">
                    <p className="text-base font-bold text-sky-800">
                      Build your own custom ERP
                    </p>
                    <p className="mt-1 text-sky-900/80">
                      No custom package selected yet. Assemble modules first, then continue to signup.
                    </p>
                    <Button asChild className="mt-3 cursor-pointer rounded-full" size="sm">
                      <Link href="/build-your-own-erp?edit=1">Build your own custom ERP</Link>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {selectedIndustry && selectedCategory ? (
              <div className="mb-5 space-y-4 lg:hidden">
                <div className="rounded-2xl border border-border bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {selectedProduct && selectedPlan ? "Your selection" : "Selected category"}
                  </p>
                  {selectedProduct && selectedPlan ? (
                    <>
                      <p className="mt-1 font-semibold text-[#0b1f3a] text-sm">
                        {selectedProduct.name} · {selectedPlan.name}
                        {billingCycle ? ` · ${billingCycle}` : ""}
                      </p>
                      {enginePricing?.price != null ? (
                        <p className="mt-2 text-sm text-[#0b1f3a]">
                          {enginePricing.originalPrice != null &&
                          enginePricing.originalPrice > enginePricing.price ? (
                            <span className="mr-2 text-muted-foreground line-through">
                              {formatPrice(enginePricing.originalPrice)}
                            </span>
                          ) : null}
                          <span className="font-semibold">{formatPrice(enginePricing.price)}</span>
                          <span className="text-muted-foreground"> {enginePricing.unitLabel}</span>
                          {enginePricing.savings != null && enginePricing.savings > 0 ? (
                            <span className="ml-2 text-emerald-700">
                              Save {formatPrice(enginePricing.savings)}
                            </span>
                          ) : enginePricing.discountPercent ? (
                            <span className="ml-2 text-emerald-700">
                              {enginePricing.discountPercent}% off
                            </span>
                          ) : null}
                        </p>
                      ) : null}
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedIndustry.name} → {selectedCategory.name}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 font-semibold text-[#0b1f3a]">
                      {selectedIndustry.name}
                      <span className="mx-2 text-muted-foreground font-normal">→</span>
                      {selectedCategory.name}
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <PosProfileCallout
                    categoryName={selectedCategory.name}
                    posRequirement={
                      selectedCategory.pos_requirement ?? selectedCategory.pos_mode
                    }
                  />
                  <MobileAppProfileCallout
                    categoryCode={selectedCategory.code}
                    categorySlug={selectedCategory.slug}
                    industryCode={selectedIndustry.code}
                    industrySlug={selectedIndustry.slug}
                    industryName={selectedCategory.name}
                    mobileRequirement={
                      selectedCategory.mobile_requirement ?? selectedCategory.mobile_mode
                    }
                  />
                </div>
              </div>
                ) : null}
                <CustomErpSignupPrompt className="mb-5 lg:hidden" />
              </>
            )}
            <form className="relative space-y-5" onSubmit={onSubmit}>
              {/* Honeypot — hidden from humans, bots often fill it */}
              <div className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden opacity-0" aria-hidden>
                <label htmlFor="website">Company website</label>
                <input
                  id="website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Work email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@company.com"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company">Company / workspace name</Label>
                  <Input
                    id="company"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Operations"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number</Label>
                  <div className="relative flex gap-2" data-phone-dial-root>
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          phoneDialTouchedRef.current = true;
                          setOpenSelect((v) => (v === "phoneDial" ? null : "phoneDial"));
                          if (openSelect !== "phoneDial") setPhoneDialSearch("");
                        }}
                        className={cn(
                          "flex h-12 w-[8rem] items-center justify-between gap-2 rounded-xl border border-border bg-white px-3 text-sm shadow-sm transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          openSelect === "phoneDial"
                            ? "border-primary ring-2 ring-primary/15"
                            : "hover:border-primary/30"
                        )}
                        aria-label="Phone country code"
                        aria-expanded={openSelect === "phoneDial"}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <span className="text-base leading-none" aria-hidden>
                            {countryFlag(selectedPhoneDial?.code)}
                          </span>
                          <span className="font-medium tabular-nums">
                            {selectedPhoneDial?.dialCode || "+"}
                          </span>
                        </span>
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
                            openSelect === "phoneDial" && "rotate-180"
                          )}
                        />
                      </button>
                      {openSelect === "phoneDial" ? (
                        <div className="absolute left-0 top-[calc(100%+0.4rem)] z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-white shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
                          <div className="border-b border-border p-2">
                            <Input
                              value={phoneDialSearch}
                              onChange={(e) => setPhoneDialSearch(e.target.value)}
                              placeholder="Search code..."
                              className="h-9"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <ul className="max-h-56 overflow-y-auto p-1.5">
                            {phoneDialOptions.length === 0 ? (
                              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                                No matches.
                              </li>
                            ) : (
                              phoneDialOptions.map((country) => {
                                const selected = phoneDialCode === country.code;
                                return (
                                  <li key={`dial-${country.code}`}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        phoneDialTouchedRef.current = true;
                                        setPhoneDialCode(country.code);
                                        setOpenSelect(null);
                                        setPhoneDialSearch("");
                                      }}
                                      className={cn(
                                        "flex h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm transition-colors",
                                        selected
                                          ? "bg-primary/8 text-primary"
                                          : "hover:bg-muted"
                                      )}
                                    >
                                      <span className="w-6 shrink-0 text-base leading-none" aria-hidden>
                                        {countryFlag(country.code)}
                                      </span>
                                      <span className="min-w-0 flex-1 truncate font-medium">
                                        {country.name}
                                      </span>
                                      <span className="shrink-0 text-muted-foreground tabular-nums">
                                        {country.dialCode}
                                      </span>
                                      {selected ? (
                                        <Check className="h-4 w-4 shrink-0 text-primary" />
                                      ) : null}
                                    </button>
                                  </li>
                                );
                              })
                            )}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="300 0000000"
                      required
                      className="min-w-0 flex-1"
                      inputMode="tel"
                      autoComplete="tel-national"
                    />
                  </div>
                </div>
              </div>

              <FancySelect
                label="Country"
                placeholder="Select your country"
                valueLabel={
                  selectedCountry ? (
                    <span className="flex items-center gap-2 truncate">
                      <span className="shrink-0 text-base leading-none" aria-hidden>
                        {countryFlag(selectedCountry.code)}
                      </span>
                      <span className="truncate">{selectedCountry.name}</span>
                      {selectedCountry.dialCode ? (
                        <span className="shrink-0 text-muted-foreground font-normal">
                          {selectedCountry.dialCode}
                        </span>
                      ) : null}
                    </span>
                  ) : undefined
                }
                open={openSelect === "country"}
                onToggle={() => {
                  setOpenSelect((v) => (v === "country" ? null : "country"));
                  if (openSelect !== "country") setCountrySearch("");
                }}
                onClose={() => {
                  setOpenSelect(null);
                  setCountrySearch("");
                }}
                required
                searchPlaceholder="Search country or code..."
                searchValue={countrySearch}
                onSearchChange={setCountrySearch}
              >
                <ul className="max-h-64 overflow-y-auto p-1.5">
                  {countryOptions.length === 0 ? (
                    <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No countries match your search.
                    </li>
                  ) : (
                    countryOptions.map((country) => {
                      const selected = countryCode === country.code;
                      return (
                        <li key={country.code}>
                          <button
                            type="button"
                            onClick={() => {
                              countryTouchedRef.current = true;
                              setCountryCode(country.code);
                              phoneDialTouchedRef.current = true;
                              setPhoneDialCode(country.code);
                              setOpenSelect(null);
                              setCountrySearch("");
                            }}
                            className={cn(
                              "flex h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm transition-colors",
                              selected ? "bg-primary/8 text-primary" : "hover:bg-muted"
                            )}
                            aria-label={formatCountryLabel(country)}
                          >
                            <span className="w-6 shrink-0 text-base leading-none" aria-hidden>
                              {countryFlag(country.code)}
                            </span>
                            <span className="min-w-0 flex-1 truncate font-medium">{country.name}</span>
                            {country.dialCode ? (
                              <span className="shrink-0 text-muted-foreground tabular-nums">
                                {country.dialCode}
                              </span>
                            ) : null}
                            {selected ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
              </FancySelect>

              {!isCustomPackage ? (
              <>
              <FancySelect
                label="Product"
                placeholder="Select a product"
                valueLabel={selectedProduct?.name}
                open={openSelect === "product"}
                onToggle={() => setOpenSelect((v) => (v === "product" ? null : "product"))}
                onClose={() => setOpenSelect(null)}
                required
              >
                <ul className="max-h-64 overflow-y-auto p-1.5">
                  {productsQuery.loading ? (
                    <li className="px-3 py-4">
                      <CatalogLoadingInline label="Loading products…" />
                    </li>
                  ) : null}
                  {productsQuery.error ? (
                    <CatalogSelectError
                      message={productsQuery.error}
                      onRetry={productsQuery.retry}
                    />
                  ) : null}
                  {!productsQuery.loading && !productsQuery.error && productsQuery.empty ? (
                    <li className="px-3 py-4 text-sm text-muted-foreground">
                      No products are published yet.
                    </li>
                  ) : null}
                  {sortedProducts.map((prod) => {
                    const selected = productId === prod.id;
                    return (
                      <li key={prod.id}>
                        <button
                          type="button"
                          onClick={() => onProductSelect(prod.id, prod.slug)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors",
                            selected ? "bg-primary/8 text-primary" : "hover:bg-muted"
                          )}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium truncate">{prod.name}</span>
                            <span className="block text-[11px] text-muted-foreground truncate">
                              {prod.description || prod.slug}
                            </span>
                          </span>
                          {selected ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </FancySelect>

              <FancySelect
                label="Plan"
                placeholder="Select a plan"
                valueLabel={
                  selectedPlan ? (
                    <span className="flex items-center gap-2 truncate">
                      <span className="truncate">{selectedPlan.name}</span>
                      {billingCycle ? (
                        <span className="shrink-0 capitalize text-muted-foreground font-normal">
                          {billingCycle}
                        </span>
                      ) : null}
                      {selectedPlan.has_free_trial && selectedPlan.trial_days ? (
                        <span className="shrink-0 text-muted-foreground font-normal">
                          {selectedPlan.trial_days}-day trial
                        </span>
                      ) : null}
                    </span>
                  ) : undefined
                }
                open={openSelect === "plan"}
                onToggle={() => setOpenSelect((v) => (v === "plan" ? null : "plan"))}
                onClose={() => setOpenSelect(null)}
                required
                disabled={!productId}
              >
                <ul className="max-h-64 overflow-y-auto p-1.5">
                  {plansQuery.loading ? (
                    <li className="px-3 py-4">
                      <CatalogLoadingInline label="Loading plans…" />
                    </li>
                  ) : null}
                  {plansQuery.error ? (
                    <CatalogSelectError message={plansQuery.error} onRetry={plansQuery.retry} />
                  ) : null}
                  {!plansQuery.loading && !plansQuery.error && signupPlans.length === 0 ? (
                    <li className="px-3 py-4 text-sm text-muted-foreground">
                      No self-serve plans for this product. Enterprise requires Contact Sales.
                    </li>
                  ) : null}
                  {signupPlans.map((p) => {
                    const selected = planId === p.id;
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setPlanId(p.id);
                            setPlanSlug(p.slug);
                            setEnginePlan(p);
                            setEngineProduct(selectedProduct || null);
                            setPlanLookupError("");
                            setOpenSelect("industry");
                          }}
                          className={cn(
                            "flex h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm transition-colors",
                            selected ? "bg-primary/8 text-primary" : "hover:bg-muted"
                          )}
                        >
                          <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                          {selected ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </FancySelect>

              <FancySelect
                label="Choose industry"
                placeholder="Select your industry"
                valueLabel={selectedIndustry?.name}
                open={openSelect === "industry"}
                onToggle={() => setOpenSelect((v) => (v === "industry" ? null : "industry"))}
                onClose={() => setOpenSelect(null)}
                required
              >
                <ul className="max-h-64 overflow-y-auto p-1.5">
                  {industriesQuery.loading ? (
                    <li className="px-3 py-4">
                      <CatalogLoadingInline label="Loading industries…" />
                    </li>
                  ) : null}
                  {industriesQuery.error ? (
                    <CatalogSelectError
                      message={industriesQuery.error}
                      onRetry={industriesQuery.retry}
                    />
                  ) : null}
                  {!industriesQuery.loading &&
                  !industriesQuery.error &&
                  industriesQuery.empty ? (
                    <li className="px-3 py-4 text-sm text-muted-foreground">
                      No industries are published yet.
                    </li>
                  ) : null}
                  {sortedIndustries.map((ind) => {
                    const Icon = getIcon(industryDisplayIcon(ind));
                    const selected = industryId === ind.id;
                    return (
                      <li key={ind.id}>
                        <button
                          type="button"
                          onClick={() => onIndustrySelect(ind.id)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors",
                            selected ? "bg-primary/8 text-primary" : "hover:bg-muted"
                          )}
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium truncate">{ind.name}</span>
                            <span className="block text-[11px] text-muted-foreground truncate">
                              {ind.description || ind.code}
                            </span>
                          </span>
                          {selected ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </FancySelect>

              {industryId ? (
                <FancySelect
                  label="Business category"
                  placeholder="Select business category"
                  valueLabel={selectedCategory?.name}
                  open={openSelect === "category"}
                  onToggle={() => setOpenSelect((v) => (v === "category" ? null : "category"))}
                  onClose={() => setOpenSelect(null)}
                  required
                >
                  <ul className="max-h-64 overflow-y-auto p-1.5">
                    {categoriesQuery.loading ? (
                      <li className="px-3 py-4">
                        <CatalogLoadingInline label="Loading categories…" />
                      </li>
                    ) : null}
                    {categoriesQuery.error ? (
                      <CatalogSelectError
                        message={categoriesQuery.error}
                        onRetry={categoriesQuery.retry}
                      />
                    ) : null}
                    {!categoriesQuery.loading &&
                    !categoriesQuery.error &&
                    categoriesQuery.data.length === 0 ? (
                      <li className="px-3 py-4 text-sm text-muted-foreground">
                        No categories for this industry.
                      </li>
                    ) : null}
                    {sortedCategories.map((cat) => {
                      const selected = categoryId === cat.id;
                      const access = getCategoryAccessHints(cat);
                      return (
                        <li key={cat.id}>
                          <button
                            type="button"
                            onClick={() => onCategorySelect(cat.id)}
                            className={cn(
                              "flex w-full items-start gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors",
                              selected ? "bg-primary/8 text-primary" : "hover:bg-muted"
                            )}
                          >
                            <span
                              className={cn(
                                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                                selected
                                  ? "border-primary bg-primary text-white"
                                  : "border-slate-300 bg-white"
                              )}
                            >
                              {selected ? <Check className="h-3 w-3" /> : null}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium">{cat.name}</span>
                              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                                {[access.posLabel, access.mobileLabel]
                                  .filter(Boolean)
                                  .join(" · ") ||
                                  cat.description ||
                                  cat.code}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </FancySelect>
              ) : null}

              {selectedCategory ? (
                <div className="space-y-3 lg:hidden">
                  <PosProfileCallout
                    categoryName={selectedCategory.name}
                    posRequirement={
                      selectedCategory.pos_requirement ?? selectedCategory.pos_mode
                    }
                  />
                  <MobileAppProfileCallout
                    categoryCode={selectedCategory.code}
                    categorySlug={selectedCategory.slug}
                    industryCode={selectedIndustry?.code}
                    industrySlug={selectedIndustry?.slug}
                    industryName={selectedCategory.name}
                    mobileRequirement={
                      selectedCategory.mobile_requirement ?? selectedCategory.mobile_mode
                    }
                  />
                </div>
              ) : null}
              </>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
                      className={cn(
                        "pr-11",
                        password.length > 0 &&
                          (passwordStrong
                            ? "border-emerald-400 focus-visible:ring-emerald-400/40"
                            : "border-amber-300 focus-visible:ring-amber-300/40")
                      )}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className={cn(
                        "pr-11",
                        confirmPassword.length > 0 &&
                          (passwordsMatch
                            ? "border-emerald-400 focus-visible:ring-emerald-400/40"
                            : "border-rose-300 focus-visible:ring-rose-300/40")
                      )}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {password.length > 0 ? (
                <div
                  className={cn(
                    "rounded-xl border px-4 py-3 transition-colors",
                    passwordStrong
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-border bg-slate-50"
                  )}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        passwordStrong ? "text-emerald-700" : "text-[#0b1f3a]"
                      )}
                    >
                      {passwordStrong ? "Password looks strong" : "Password must include"}
                    </p>
                    {passwordStrong ? <Check className="h-4 w-4 text-emerald-600" /> : null}
                  </div>
                  <ul className="grid gap-1.5 sm:grid-cols-2">
                    {ruleStatus.map((r) => (
                      <li
                        key={r.id}
                        className={cn(
                          "flex items-center gap-2 text-xs",
                          r.ok ? "text-emerald-700" : "text-muted-foreground"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-full border",
                            r.ok
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-slate-300 bg-white"
                          )}
                        >
                          {r.ok ? <Check className="h-2.5 w-2.5" /> : null}
                        </span>
                        {r.label}
                      </li>
                    ))}
                  </ul>
                  {confirmPassword.length > 0 && !passwordsMatch ? (
                    <p className="mt-2 text-xs text-rose-600">Passwords do not match.</p>
                  ) : null}
                  {passwordsMatch ? (
                    <p className="mt-2 text-xs text-emerald-700">Passwords match.</p>
                  ) : null}
                </div>
              ) : null}

              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  className="mt-1"
                  checked={agree}
                  onCheckedChange={(v) => setAgree(v === true)}
                />
                <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground leading-relaxed">
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms &amp; Conditions
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </Label>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="marketing"
                  className="mt-1"
                  checked={marketingOptIn}
                  onCheckedChange={(v) => setMarketingOptIn(v === true)}
                />
                <div className="space-y-1">
                  <Label htmlFor="marketing" className="text-sm font-normal text-muted-foreground leading-relaxed">
                    Send me product updates and marketing emails (optional).
                  </Label>
                  {marketingOptIn && email.trim() ? (
                    <p className="text-xs text-emerald-700">
                      Updates will be sent to {email.trim().toLowerCase()} after signup.
                    </p>
                  ) : null}
                </div>
              </div>

              {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-black">
                  {error}
                </div>
              ) : null}
              {success ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {success}
                </div>
              ) : null}
              {captchaLoading ? (
                <div className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                  Preparing security check...
                </div>
              ) : null}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={
                  loading ||
                  submitBlocked ||
                  !countryCode ||
                  !passwordStrong ||
                  !passwordsMatch ||
                  (isCustomPackage
                    ? !customPackage?.selected_modules?.length
                    : !productId || !planId || !industryId || !categoryId)
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating workspace...
                  </>
                ) : captchaLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading security check...
                  </>
                ) : (
                  signupCtaLabel
                )}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Log in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function SignUpClient(props: SignUpClientProps = {}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
          Loading signup...
        </div>
      }
    >
      <SignUpForm {...props} />
    </Suspense>
  );
}

export default SignUpClient;
