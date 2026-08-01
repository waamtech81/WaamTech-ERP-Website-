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
  as: TitleTag = "h2",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <div
      className={cn(
        "mb-10 md:mb-14 max-w-3xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow ? (
        <p className="mb-3 font-sans text-sm font-semibold tracking-[0.16em] text-primary uppercase">
          {eyebrow}
        </p>
      ) : null}
      <TitleTag className="font-heading text-section font-semibold tracking-tight text-balance text-[#0b1f3a]">
        {title}
      </TitleTag>
      {description ? (
        <p
          className={cn(
            "mt-4 max-w-2xl font-sans text-description font-normal text-muted-foreground leading-relaxed text-pretty",
            align === "center" && "mx-auto"
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
