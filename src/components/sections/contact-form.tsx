"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  executeRecaptcha,
  hasRecaptchaV3SiteKey,
  RecaptchaV3,
} from "@/components/security/recaptcha-v3";
import { apiMessageFromJson, friendlyNetworkError } from "@/lib/network/errors";

const empty = {
  name: "",
  email: "",
  company: "",
  phone: "",
  subject: "",
  message: "",
};

export function ContactForm({
  initialSubject = "",
  intent = null,
}: {
  initialSubject?: string;
  intent?: string | null;
}) {
  const [values, setValues] = useState(() => ({
    ...empty,
    subject: initialSubject,
  }));
  const [formStartedAt] = useState(() => Date.now());
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const allFilled = useMemo(() => {
    return (
      values.name.trim() !== "" &&
      values.email.trim() !== "" &&
      values.company.trim() !== "" &&
      values.phone.trim() !== "" &&
      values.subject.trim() !== "" &&
      values.message.trim() !== ""
    );
  }, [values]);

  function update(field: keyof typeof empty, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setError("");
    setSuccess("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allFilled || loading) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      let captchaToken: string | null = null;
      if (hasRecaptchaV3SiteKey()) {
        captchaToken = await executeRecaptcha("contact_form");
        if (!captchaToken) {
          setError("Captcha failed to load. Please refresh and try again.");
          return;
        }
      }

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          company: values.company.trim(),
          phone: values.phone.trim(),
          subject: values.subject.trim(),
          message: values.message.trim(),
          intent: intent || undefined,
          ...(captchaToken ? { captchaToken } : {}),
          website: honeypot,
          _t: formStartedAt,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
      };

      if (!res.ok || !data.success) {
        setError(apiMessageFromJson(data, "Could not send your message. Please try again."));
        return;
      }

      setSuccess(apiMessageFromJson(data, "Thanks — your message has been sent."));
      setValues({ ...empty, subject: initialSubject });
    } catch (err) {
      setError(friendlyNetworkError(err, "Could not send your message. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="relative space-y-4" onSubmit={onSubmit} noValidate>
      <RecaptchaV3 />
      <div className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden>
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">
            Full name <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            placeholder="Alex Morgan"
            required
            value={values.name}
            onChange={(e) => update("name", e.target.value)}
            autoComplete="name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">
            Work email <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="alex@company.com"
            required
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
            autoComplete="email"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="company">
            Company <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="company"
            name="company"
            placeholder="Acme Operations"
            required
            value={values.company}
            onChange={(e) => update("company", e.target.value)}
            autoComplete="organization"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">
            Phone <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+971 50 000 0000"
            required
            value={values.phone}
            onChange={(e) => update("phone", e.target.value)}
            autoComplete="tel"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">
          Subject <span className="text-rose-500">*</span>
        </Label>
        <Input
          id="subject"
          name="subject"
          placeholder="Demo request / Enterprise quote"
          required
          value={values.subject}
          onChange={(e) => update("subject", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">
          Message <span className="text-rose-500">*</span>
        </Label>
        <Textarea
          id="message"
          name="message"
          placeholder="Tell us about your current systems and goals..."
          required
          value={values.message}
          onChange={(e) => update("message", e.target.value)}
        />
      </div>

      {error ? (
        <p className="text-sm text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm text-emerald-700" role="status">
          {success}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={!allFilled || loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          "Send message"
        )}
      </Button>
    </form>
  );
}
