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
    <Card
      className={cn(
        "h-full hover:border-primary/20 hover:shadow-[var(--shadow-md)]",
        className
      )}
    >
      <CardHeader>
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/[0.08] text-primary ring-1 ring-primary/10">
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {features?.length ? (
        <CardContent>
          <ul className="space-y-2.5">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-snug">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                {f}
              </li>
            ))}
          </ul>
        </CardContent>
      ) : null}
    </Card>
  );
}
