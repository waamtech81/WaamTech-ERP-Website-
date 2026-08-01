import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/section";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[70vh] items-center">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <Container className="relative py-20 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">404</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Page not found</h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or may have moved. Continue from a
          trusted path below.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
          <Button asChild>
            <Link href="/">Back to home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/pricing">View pricing</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/build-your-own-erp">Build your own ERP</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/support">Get support</Link>
          </Button>
        </div>
      </Container>
    </div>
  );
}
