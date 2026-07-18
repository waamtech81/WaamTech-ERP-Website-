import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/section";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[70vh] items-center">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <Container className="relative text-center py-20">
        <p className="text-sm font-medium text-primary uppercase tracking-wide">404</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-4 text-muted-foreground max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <Button asChild>
            <Link href="/">Back to home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/pricing">View pricing</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/support">Get support</Link>
          </Button>
        </div>
      </Container>
    </div>
  );
}
