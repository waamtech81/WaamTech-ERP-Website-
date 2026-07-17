"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Boxes,
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
import { siteConfig } from "@/lib/data/site";
import {
  getBusinessCategory,
  getBusinessIndustry,
  getCategoriesForIndustry,
  getFeaturedIndustries,
  getIndustryForCategory,
  getIndustryLucideIcon,
  hierarchyStats,
  resolveBusinessCategoryId,
  type BusinessIndustry,
} from "@/lib/data/business-hierarchy";
import { authConfig, getAppLoginUrl } from "@/lib/auth/config";
import { MobileAppProfileCallout } from "@/components/shared/mobile-app-callout";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

const plans = [
  { id: "starter", name: "Starter" },
  { id: "professional", name: "Professional" },
  { id: "business", name: "Business" },
];

const selectClassName =
  "flex h-12 w-full rounded-xl border border-border bg-white px-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type StrengthRule = { id: string; label: string; test: (v: string) => boolean };

const passwordRules: StrengthRule[] = [
  { id: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { id: "lower", label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { id: "upper", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { id: "number", label: "One number", test: (v) => /\d/.test(v) },
  { id: "special", label: "One special character (!@#$…)", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

function orderedIndustries(): BusinessIndustry[] {
  return getFeaturedIndustries().all;
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
}: {
  label: string;
  placeholder: string;
  valueLabel?: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: React.ReactNode;
  disabled?: boolean;
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
      <Label>{label}</Label>
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
          <span className={cn("truncate", valueLabel ? "text-foreground font-medium" : "text-muted-foreground")}>
            {valueLabel || placeholder}
          </span>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          />
        </button>
        {open ? (
          <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-40 overflow-hidden rounded-xl border border-border bg-white shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SignUpForm() {
  const searchParams = useSearchParams();
  const defaultCategoryId = resolveBusinessCategoryId(
    searchParams.get("profile") || searchParams.get("category") || ""
  );
  const defaultIndustryFromQuery = searchParams.get("industry");
  const hasPrefill =
    Boolean(defaultIndustryFromQuery && getBusinessIndustry(defaultIndustryFromQuery)) ||
    Boolean(searchParams.get("profile") || searchParams.get("category"));

  const defaultIndustryId = hasPrefill
    ? defaultIndustryFromQuery && getBusinessIndustry(defaultIndustryFromQuery)
      ? defaultIndustryFromQuery
      : getIndustryForCategory(defaultCategoryId)?.id || ""
    : "";

  const defaultPlan = searchParams.get("plan") || "professional";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [industryId, setIndustryId] = useState(defaultIndustryId);
  const [categoryId, setCategoryId] = useState(
    searchParams.get("profile") || searchParams.get("category") ? defaultCategoryId : ""
  );
  const [plan, setPlan] = useState(defaultPlan);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [checkEmail, setCheckEmail] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [formStartedAt] = useState(() => Date.now());
  const [openSelect, setOpenSelect] = useState<"industry" | "category" | null>(null);

  const industries = useMemo(() => orderedIndustries(), []);
  const categoryOptions = useMemo(
    () => (industryId ? getCategoriesForIndustry(industryId) : []),
    [industryId]
  );

  const selectedIndustry = useMemo(
    () => (industryId ? getBusinessIndustry(industryId) : undefined),
    [industryId]
  );
  const selectedCategory = useMemo(
    () => (categoryId ? getBusinessCategory(categoryId) : undefined),
    [categoryId]
  );

  const ruleStatus = useMemo(
    () => passwordRules.map((r) => ({ ...r, ok: r.test(password) })),
    [password]
  );
  const passwordStrong = ruleStatus.every((r) => r.ok);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  useEffect(() => {
    if (!industryId) return;
    if (categoryId && !categoryOptions.some((c) => c.id === categoryId)) {
      setCategoryId("");
    }
  }, [categoryOptions, categoryId, industryId]);

  function onIndustrySelect(nextIndustryId: string) {
    setIndustryId(nextIndustryId);
    setCategoryId("");
    setOpenSelect("category");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!agree) {
      setError("Please accept the Terms and Privacy Policy.");
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
          phone: phone || undefined,
          company_name: companyName,
          profile_id: categoryId,
          business_category_id: categoryId,
          industry_id: industryId,
          plan,
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

      if (json.requiresVerification) {
        setMaskedEmail(json.data?.email || email);
        setCheckEmail(true);
        setSuccess(json.message || "Check your email to verify your account.");
        setLoading(false);
        return;
      }

      setSuccess(json.message || "Account created. Please verify your email, then log in.");
      setLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (checkEmail) {
    return (
      <div className="relative min-h-[calc(100vh-4rem)] bg-muted">
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        <div className="container-site relative flex justify-center py-16 lg:py-24">
          <Card className="w-full max-w-lg shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
            <CardContent className="px-6 py-10 sm:px-10 text-center">
              <Link href="/" className="mx-auto mb-6 inline-flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
                  <Boxes className="h-4 w-4" />
                </span>
                <span className="font-[family-name:var(--font-poppins)] text-lg font-semibold">
                  {siteConfig.name}
                </span>
              </Link>
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Mail className="h-7 w-7" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0b1f3a]">
                Check your email
              </h1>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                We sent a verification link to{" "}
                <span className="font-medium text-foreground">{maskedEmail}</span>. After you verify,
                your trial will be registered on our license server and your{" "}
                <strong className="text-foreground">license key</strong> will be emailed to you.
              </p>
              <div className="mt-6 rounded-2xl border border-border bg-slate-50 px-4 py-4 text-left text-sm text-muted-foreground leading-relaxed">
                <p className="font-medium text-[#0b1f3a] mb-2">What happens next</p>
                <ol className="space-y-1.5 list-decimal list-inside">
                  <li>Verify your email from the link we sent</li>
                  <li>Receive your trial license key by email</li>
                  <li>Open {authConfig.appUrl.replace(/^https?:\/\//, "")} and log in</li>
                  <li>Paste the license key in the app to start your trial</li>
                </ol>
              </div>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg" className="rounded-full px-8">
                  <a href={getAppLoginUrl()}>Open WAAMTO App</a>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8"
                  onClick={() => setCheckEmail(false)}
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

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-muted">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div className="container-site relative grid gap-8 py-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start lg:gap-10 lg:py-16">
        <div className="max-w-xl lg:sticky lg:top-24">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6 sm:mb-8">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
              <Boxes className="h-4 w-4" />
            </span>
            <span className="font-[family-name:var(--font-poppins)] text-lg font-semibold">
              {siteConfig.name}
            </span>
          </Link>
          <Badge variant="accent" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            {authConfig.trialDays}-day free trial
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-balance">
            Create your workspace in minutes
          </h1>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Choose your industry and business category, then open {siteConfig.name} —{" "}
            {hierarchyStats.industries} industries · {hierarchyStats.categories}+ categories.
          </p>
          <ul className="mt-6 sm:mt-8 space-y-3 text-sm text-muted-foreground">
            {[
              `${authConfig.trialDays}-day free trial after email verification`,
              "Industry → business category auto-provisions modules",
              "Responsive web on desktop, tablet & phone",
              "Native mobile app when your category needs field work",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          {selectedIndustry && selectedCategory ? (
            <div className="mt-6 sm:mt-8 space-y-4 hidden lg:block">
              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Selected profile
                </p>
                <p className="mt-1 font-semibold text-[#0b1f3a]">
                  {selectedIndustry.name}
                  <span className="mx-2 text-muted-foreground font-normal">→</span>
                  {selectedCategory.name}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{selectedIndustry.description}</p>
              </div>
              <MobileAppProfileCallout
                industryId={selectedCategory.id}
                industryName={selectedCategory.name}
              />
            </div>
          ) : null}
        </div>

        <Card className="mx-auto w-full max-w-2xl shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl">Sign up</CardTitle>
            <CardDescription>
              Start free · then continue into the {siteConfig.name} app
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92 300 0000000"
                  />
                </div>
              </div>

              <FancySelect
                label="Choose industry"
                placeholder="Select your industry"
                valueLabel={selectedIndustry?.name}
                open={openSelect === "industry"}
                onToggle={() => setOpenSelect((v) => (v === "industry" ? null : "industry"))}
                onClose={() => setOpenSelect(null)}
              >
                <ul className="max-h-64 overflow-y-auto p-1.5">
                  {industries.map((ind) => {
                    const Icon = getIcon(getIndustryLucideIcon(ind));
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
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
                            style={{ backgroundColor: ind.color }}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium truncate">{ind.name}</span>
                            <span className="block text-[11px] text-muted-foreground">
                              {getCategoriesForIndustry(ind.id).length} categories
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
                >
                  <ul className="max-h-64 overflow-y-auto p-1.5">
                    {categoryOptions.map((cat) => {
                      const selected = categoryId === cat.id;
                      return (
                        <li key={cat.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setCategoryId(cat.id);
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
                              <span className="block text-sm font-medium">{cat.name}</span>
                              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                                POS {cat.pos_mode}
                                {cat.mobile_mode === "required" ? " · Mobile included" : ""}
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
                <div className="lg:hidden">
                  <MobileAppProfileCallout
                    industryId={selectedCategory.id}
                    industryName={selectedCategory.name}
                    compact
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="plan">Preferred plan</Label>
                <select
                  id="plan"
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className={selectClassName}
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {authConfig.trialDays}-day trial
                    </option>
                  ))}
                </select>
              </div>

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
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  .
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
                disabled={loading || !categoryId || !passwordStrong || !passwordsMatch}
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
              <a href={getAppLoginUrl()} className="text-primary font-medium hover:underline">
                Open WAAMTO App
              </a>
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
