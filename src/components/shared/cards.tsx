import Link from "next/link";
import { cn } from "@/lib/utils";
import { getIcon } from "@/lib/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
