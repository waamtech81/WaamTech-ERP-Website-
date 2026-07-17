import { cn } from "@/lib/utils";

export function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("container-site", className)}>{children}</div>;
}

export function Section({
  children,
  className,
  id,
  muted = false,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  muted?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn("section-padding", muted && "bg-muted", className)}
    >
      {children}
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-12 md:mb-16 max-w-3xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow ? (
        <p className="mb-3 text-sm font-medium tracking-wide text-primary uppercase font-sans">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-heading text-section font-semibold tracking-tight text-balance">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 font-sans text-description font-normal text-muted-foreground leading-relaxed text-balance">
          {description}
        </p>
      ) : null}
    </div>
  );
}
