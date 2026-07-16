import Link from "next/link";
import { cn } from "@/lib/utils";
import { getIcon } from "@/lib/icons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ProductCard({
  name,
  tagline,
  description,
  icon,
  href,
  status,
  features,
}: {
  name: string;
  tagline: string;
  description: string;
  icon: string;
  href: string;
  status?: "available" | "coming-soon";
  features?: string[];
}) {
  const Icon = getIcon(icon);

  return (
    <Link href={href} className="group block h-full">
      <Card className="h-full hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(15,23,42,0.08)] hover:border-primary/20">
        <CardHeader>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/8 text-primary transition-transform duration-300 group-hover:scale-105">
              <Icon className="h-5 w-5" />
            </div>
            {status === "coming-soon" ? (
              <Badge variant="secondary">Coming soon</Badge>
            ) : null}
          </div>
          <CardTitle className="group-hover:text-primary transition-colors">{name}</CardTitle>
          <CardDescription className="font-medium text-foreground/70">{tagline}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          {features?.length ? (
            <ul className="mt-5 flex flex-wrap gap-2">
              {features.slice(0, 3).map((f) => (
                <li key={f}>
                  <Badge variant="muted">{f}</Badge>
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}

export function FeatureCard({
  title,
  description,
  icon,
  features,
  className,
}: {
  title: string;
  description: string;
  icon: string;
  features?: string[];
  className?: string;
}) {
  const Icon = getIcon(icon);

  return (
    <Card className={cn("h-full hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(15,23,42,0.08)]", className)}>
      <CardHeader>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/8 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {features?.length ? (
        <CardContent>
          <ul className="space-y-2">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                {f}
              </li>
            ))}
          </ul>
        </CardContent>
      ) : null}
    </Card>
  );
}

export function IndustryCard({
  name,
  description,
  icon,
  href,
  benefits,
}: {
  name: string;
  description: string;
  icon: string;
  href: string;
  benefits?: string[];
}) {
  const Icon = getIcon(icon);

  return (
    <Link href={href} className="group block h-full">
      <Card className="h-full hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(15,23,42,0.08)] hover:border-primary/20">
        <CardHeader>
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-primary transition-colors group-hover:bg-primary/10">
            <Icon className="h-5 w-5" />
          </div>
          <CardTitle className="text-base group-hover:text-primary transition-colors">{name}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {benefits?.length ? (
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {benefits.map((b) => (
                <Badge key={b} variant="outline">
                  {b}
                </Badge>
              ))}
            </div>
          </CardContent>
        ) : null}
      </Card>
    </Link>
  );
}
