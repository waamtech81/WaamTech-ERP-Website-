"use client";

import Link from "next/link";
import { Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/lib/data/site";

export default function SignUpPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-muted">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div className="container-site relative grid gap-10 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
        <div className="hidden lg:block max-w-lg">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
              <Boxes className="h-4 w-4" />
            </span>
            <span className="font-[family-name:var(--font-poppins)] text-lg font-semibold">
              {siteConfig.name}
            </span>
          </Link>
          <h1 className="text-4xl font-semibold tracking-tight text-balance">
            Create your workspace in minutes
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            Set up your company, invite your team, and start configuring the modules that matter to your operations.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
            {[
              "14-day free trial on eligible plans",
              "Guided workspace setup",
              "No credit card required to start",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <Card className="mx-auto w-full max-w-md shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
          <CardHeader>
            <CardTitle className="text-2xl">Sign up</CardTitle>
            <CardDescription>Create your WaamTech account and workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 mb-6">
              <Button variant="outline" type="button" className="w-full">
                Continue with Google
              </Button>
              <Button variant="outline" type="button" className="w-full">
                Continue with Microsoft
              </Button>
            </div>
            <div className="relative mb-6">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-muted-foreground">
                or email
              </span>
            </div>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" placeholder="Alex" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" placeholder="Morgan" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Work email</Label>
                <Input id="email" type="email" placeholder="alex@company.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company / workspace name</Label>
                <Input id="company" placeholder="Acme Operations" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" required />
              </div>
              <div className="flex items-start gap-2">
                <Checkbox id="terms" className="mt-1" />
                <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground leading-relaxed">
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline">Terms</Link> and{" "}
                  <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                </Label>
              </div>
              <Button type="submit" className="w-full" size="lg">
                Create workspace
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
