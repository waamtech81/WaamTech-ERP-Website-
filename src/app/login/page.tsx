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

export default function LoginPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-muted">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div className="container-site relative flex justify-center py-16 lg:py-24">
        <Card className="w-full max-w-md shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
          <CardHeader className="text-center">
            <Link href="/" className="mx-auto mb-4 inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
                <Boxes className="h-4 w-4" />
              </span>
              <span className="font-[family-name:var(--font-poppins)] text-lg font-semibold">
                {siteConfig.name}
              </span>
            </Link>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Log in to your WaamTech workspace.</CardDescription>
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
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="alex@company.com" required />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/login#forgot" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input id="password" type="password" placeholder="••••••••" required />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="remember" />
                <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
                  Remember me
                </Label>
              </div>
              <Button type="submit" className="w-full" size="lg">
                Log in
              </Button>
            </form>

            <div id="forgot" className="mt-8 rounded-2xl border border-border bg-muted p-4">
              <p className="text-sm font-medium">Forgot password</p>
              <p className="mt-1 text-xs text-muted-foreground mb-3">
                Enter your email and we&apos;ll send a reset link.
              </p>
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <Input type="email" placeholder="Work email" className="bg-white" />
                <Button type="submit" variant="outline">
                  Send
                </Button>
              </form>
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              New to WaamTech?{" "}
              <Link href="/signup" className="text-primary font-medium hover:underline">
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
