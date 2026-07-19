"use client";

import { Component, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Keeps portal UI from falling through to the global 500 page on a single view crash.
 */
export class PortalErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[portal-error-boundary]", error?.message || error);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-8 text-black"
        role="alert"
      >
        <div className="mx-auto flex max-w-lg flex-col items-start gap-4">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-600">
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#0549a4]">
              Portal view error
            </p>
            <h2 className="mt-1 text-xl font-semibold text-black">
              This section could not load
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              You can retry this view or go back to the dashboard. Other portal pages stay
              available.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="rounded-xl"
              onClick={() => this.setState({ error: null })}
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/portal">
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
