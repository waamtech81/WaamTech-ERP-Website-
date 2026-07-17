"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
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
import { authConfig, getAppLoginUrl } from "@/lib/auth/config";
import { useLocale } from "@/components/providers/locale-provider";
import {
  COUNTRIES,
  countryFlag,
  formatCountryLabel,
  getCountryByCode,
  mergePhoneWithDialCode,
} from "@/lib/data/countries";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import {
  useCatalogBusinessCategories,
  useCatalogBusinessProfiles,
  useCatalogIndustries,
  useCatalogPlans,
  useCatalogProducts,
} from "@/hooks/use-commercial";
import {
  CatalogLoadingInline,
  CatalogSelectError,
} from "@/components/commercial/catalog-states";
import { friendlyNetworkError } from "@/lib/network/errors";
import { industryDisplayIcon } from "@/lib/commercial/mappers";

type StrengthRule = { id: string; label: string; test: (v: string) => boolean };

const passwordRules: StrengthRule[] = [
  { id: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { id: "lower", label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { id: "upper", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { id: "number", label: "One number", test: (v) => /\d/.test(v) },
  { id: "special", label: "One special character (!@#$…)", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

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

function SignUpForm() {
  const searchParams = useSearchParams();
  const { country: detectedCountry } = useLocale();

  const defaultProductSlug = searchParams.get("product") || "";
  const defaultPlanSlug = searchParams.get("plan") || "";
  const defaultPlanId = searchParams.get("plan_id") || "";
  const defaultIndustryId = searchParams.get("industry") || "";
  const defaultCategoryId = searchParams.get("category") || "";
  const defaultProfileId = searchParams.get("profile") || "";

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
  const [industryId, setIndustryId] = useState(defaultIndustryId);
  const [categoryId, setCategoryId] = useState(defaultCategoryId);
  const [profileId, setProfileId] = useState(defaultProfileId);
  const [agree, setAgree] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [trialReady, setTrialReady] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [registrationId, setRegistrationId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [username, setUsername] = useState("");
  const [trialEndsAt, setTrialEndsAt] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [formStartedAt] = useState(() => Date.now());
  const [openSelect, setOpenSelect] = useState<
    | "country"
    | "phoneDial"
    | "product"
    | "plan"
    | "industry"
    | "category"
    | "profile"
    | null
  >(null);
  const countryTouchedRef = useRef(false);
  const phoneDialTouchedRef = useRef(false);

  const productsQuery = useCatalogProducts();
  const plansQuery = useCatalogPlans(productSlug || null);
  const industriesQuery = useCatalogIndustries();
  const categoriesQuery = useCatalogBusinessCategories(industryId || null);
  const profilesQuery = useCatalogBusinessProfiles(categoryId || null);

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
          String(p.tier || p.slug).toLowerCase() !== "enterprise"
      ),
    [plansQuery.data]
  );

  const selectedProduct = useMemo(
    () => productsQuery.data.find((p) => p.id === productId || p.slug === productSlug),
    [productsQuery.data, productId, productSlug]
  );
  const selectedPlan = useMemo(
    () => signupPlans.find((p) => p.id === planId || p.slug === planSlug),
    [signupPlans, planId, planSlug]
  );
  const selectedIndustry = useMemo(
    () => industriesQuery.data.find((i) => i.id === industryId),
    [industriesQuery.data, industryId]
  );
  const selectedCategory = useMemo(
    () => categoriesQuery.data.find((c) => c.id === categoryId),
    [categoriesQuery.data, categoryId]
  );
  const selectedProfile = useMemo(
    () => profilesQuery.data.find((p) => p.id === profileId),
    [profilesQuery.data, profileId]
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
    const business = signupPlans.find((p) => p.slug === "business" || p.tier === "business");
    const next = fromSlug || business || signupPlans[0];
    if (next) {
      setPlanId(next.id);
      setPlanSlug(next.slug);
    }
  }, [signupPlans, planId, planSlug]);

  const ruleStatus = useMemo(
    () => passwordRules.map((r) => ({ ...r, ok: r.test(password) })),
    [password]
  );
  const passwordStrong = ruleStatus.every((r) => r.ok);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  useEffect(() => {
    if (!industryId) return;
    if (categoryId && !categoriesQuery.data.some((c) => c.id === categoryId)) {
      setCategoryId("");
      setProfileId("");
    }
  }, [categoriesQuery.data, categoryId, industryId]);

  useEffect(() => {
    if (!categoryId) return;
    if (profileId && !profilesQuery.data.some((p) => p.id === profileId)) {
      setProfileId("");
    }
  }, [profilesQuery.data, profileId, categoryId]);

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
    setOpenSelect("plan");
  }

  function onIndustrySelect(nextIndustryId: string) {
    setIndustryId(nextIndustryId);
    setCategoryId("");
    setProfileId("");
    setOpenSelect("category");
  }

  function onCategorySelect(nextCategoryId: string) {
    setCategoryId(nextCategoryId);
    setProfileId("");
    setOpenSelect("profile");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

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

    if (!productId) {
      setError("Please choose a product.");
      return;
    }

    if (!planId || !planSlug) {
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

    if (!profileId) {
      setError("Please select a business profile.");
      return;
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
          product_id: productId,
          product_slug: productSlug,
          plan_id: planId,
          plan: planSlug,
          industry_id: industryId,
          category_id: categoryId,
          business_category_id: categoryId,
          profile_id: profileId,
          marketing_opt_in: marketingOptIn,
          website: honeypot,
          _t: formStartedAt,
        }),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.message || "Signup failed.");
        setLoading(false);
        return;
      }

      if (json.requiresOtp || json.requiresVerification) {
        setMaskedEmail(json.data?.email || email);
        setRegistrationId(json.data?.registrationId || "");
        setOtpStep(true);
        setSuccess(json.message || "Enter the verification code sent to your email.");
        setLoading(false);
        return;
      }

      setSuccess(json.message || "Account created.");
      setLoading(false);
    } catch (err) {
      setError(friendlyNetworkError(err, "Something went wrong. Please try again."));
      setLoading(false);
    }
  }

  async function onVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!registrationId) {
      setError("Registration session expired. Please start again.");
      return;
    }
    if (!otpCode.trim()) {
      setError("Enter the verification code from your email.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration_id: registrationId,
          otp: otpCode.trim(),
          email,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message || "Verification failed.");
        setLoading(false);
        return;
      }

      setUsername(json.data?.username || "");
      setTrialEndsAt(json.data?.trialEndsAt || "");
      setTrialReady(true);
      setOtpStep(false);
      setSuccess(json.message || "Trial activated.");
      setLoading(false);

      const redirectTo =
        json.data?.redirectUrl ||
        json.data?.loginUrl ||
        getAppLoginUrl({ email, verified: true, registered: true });
      window.setTimeout(() => {
        window.location.assign(redirectTo);
      }, 3500);
    } catch (err) {
      setError(friendlyNetworkError(err, "Something went wrong. Please try again."));
      setLoading(false);
    }
  }

  async function onResendOtp() {
    if (!registrationId) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resend",
          registration_id: registrationId,
          email,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message || "Could not resend code.");
      } else {
        setSuccess(json.message || "A new code was sent.");
      }
    } catch (err) {
      setError(friendlyNetworkError(err, "Could not resend code."));
    } finally {
      setLoading(false);
    }
  }

  if (trialReady) {
    return (
      <div className="relative min-h-[calc(100vh-4rem)] bg-muted">
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        <div className="container-site relative flex justify-center py-16 lg:py-24">
          <Card className="w-full max-w-lg shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
            <CardContent className="px-6 py-10 sm:px-10 text-center">
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
                <p className="font-medium text-[#0b1f3a] mb-2">What&apos;s included</p>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li>{authConfig.trialDays}-day full-featured trial</li>
                  {trialEndsAt ? <li>Expires {new Date(trialEndsAt).toLocaleDateString()}</li> : null}
                  <li>Automatic license validation — no key to paste</li>
                  <li>Welcome email with your username and login link</li>
                </ul>
              </div>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg" className="rounded-full px-8">
                  <a href={getAppLoginUrl({ email, verified: true, registered: true })}>
                    Continue to WAAMTO ERP
                  </a>
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">Redirecting automatically…</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (otpStep) {
    return (
      <div className="relative min-h-[calc(100vh-4rem)] bg-muted">
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
                to activate your trial.
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
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                ) : null}
                {success ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {success}
                  </div>
                ) : null}
                <Button type="submit" className="w-full" size="lg" disabled={loading || otpCode.length < 4}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying...
                    </>
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
                  disabled={loading}
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
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div className="container-site relative grid gap-8 py-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start lg:gap-10 lg:py-16">
        <div className="max-w-xl lg:sticky lg:top-24">
          <Badge variant="accent" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            {authConfig.trialDays}-day free trial
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-balance">
            Create your workspace in minutes
          </h1>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Select product → plan → industry → category → profile from the License Engine catalog,
            then verify your email to start your trial.
          </p>
          <ul className="mt-6 sm:mt-8 space-y-3 text-sm text-muted-foreground">
            {[
              `${authConfig.trialDays}-day free trial after email verification`,
              "All commercial selections come from License Engine (SSOT)",
              "Responsive web on desktop, tablet & phone",
              "Enterprise plans use Contact Sales — never fixed pricing",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          {selectedProduct && selectedPlan && selectedIndustry && selectedCategory && selectedProfile ? (
            <div className="mt-6 sm:mt-8 space-y-4 hidden lg:block">
              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Selected commercial profile
                </p>
                <p className="mt-1 font-semibold text-[#0b1f3a] text-sm leading-relaxed">
                  {selectedProduct.name} · {selectedPlan.name}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedIndustry.name} → {selectedCategory.name} → {selectedProfile.name}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <Card className="mx-auto w-full max-w-2xl shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl">Sign up</CardTitle>
            <CardDescription>
              Start free · verify email · open your workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedProduct && selectedPlan && selectedIndustry && selectedCategory && selectedProfile ? (
              <div className="mb-5 space-y-4 lg:hidden">
                <div className="rounded-2xl border border-border bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Selected commercial profile
                  </p>
                  <p className="mt-1 font-semibold text-[#0b1f3a] text-sm">
                    {selectedProduct.name} · {selectedPlan.name}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedIndustry.name} → {selectedCategory.name} → {selectedProfile.name}
                  </p>
                </div>
              </div>
            ) : null}
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
                  {productsQuery.data.map((prod) => {
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
                      {selectedPlan.has_free_trial ? (
                        <span className="shrink-0 text-muted-foreground font-normal">
                          {selectedPlan.trial_days || authConfig.trialDays}-day trial
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
                  {industriesQuery.data.map((ind) => {
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
                    {categoriesQuery.data.map((cat) => {
                      const selected = categoryId === cat.id;
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
                                {cat.description || cat.code}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </FancySelect>
              ) : null}

              {categoryId ? (
                <FancySelect
                  label="Business profile"
                  placeholder="Select business profile"
                  valueLabel={selectedProfile?.name}
                  open={openSelect === "profile"}
                  onToggle={() => setOpenSelect((v) => (v === "profile" ? null : "profile"))}
                  onClose={() => setOpenSelect(null)}
                  required
                >
                  <ul className="max-h-64 overflow-y-auto p-1.5">
                    {profilesQuery.loading ? (
                      <li className="px-3 py-4">
                        <CatalogLoadingInline label="Loading profiles…" />
                      </li>
                    ) : null}
                    {profilesQuery.error ? (
                      <CatalogSelectError
                        message={profilesQuery.error}
                        onRetry={profilesQuery.retry}
                      />
                    ) : null}
                    {!profilesQuery.loading &&
                    !profilesQuery.error &&
                    profilesQuery.data.length === 0 ? (
                      <li className="px-3 py-4 text-sm text-muted-foreground">
                        No profiles for this category.
                      </li>
                    ) : null}
                    {profilesQuery.data.map((prof) => {
                      const selected = profileId === prof.id;
                      return (
                        <li key={prof.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setProfileId(prof.id);
                              setOpenSelect(null);
                            }}
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
                              <span className="block text-sm font-medium">{prof.name}</span>
                              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                                {prof.description || prof.code}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </FancySelect>
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
                <Label htmlFor="marketing" className="text-sm font-normal text-muted-foreground leading-relaxed">
                  Send me product updates and marketing emails (optional).
                </Label>
              </div>

              {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
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
                disabled={
                  loading ||
                  !countryCode ||
                  !productId ||
                  !planId ||
                  !industryId ||
                  !categoryId ||
                  !profileId ||
                  !passwordStrong ||
                  !passwordsMatch
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating workspace...
                  </>
                ) : (
                  `Start ${authConfig.trialDays}-day free trial`
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

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
          Loading signup...
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
