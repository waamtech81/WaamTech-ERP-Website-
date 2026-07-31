import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-sans text-sm font-medium transition-[background-color,box-shadow,border-color,color,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[var(--shadow-xs)] hover:bg-[var(--brand-dark)] hover:shadow-[var(--shadow-sm)]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[var(--shadow-xs)] hover:bg-[#4338ca] hover:shadow-[var(--shadow-sm)]",
        outline:
          "border border-border bg-white text-foreground shadow-[var(--shadow-xs)] hover:border-primary/25 hover:bg-muted/80",
        ghost: "text-foreground/80 hover:bg-muted hover:text-foreground",
        accent:
          "bg-accent text-accent-foreground shadow-[var(--shadow-xs)] hover:bg-[#0d8a5f] hover:shadow-[var(--shadow-sm)]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-md px-3.5 text-xs",
        lg: "h-12 rounded-lg px-7 text-[0.9375rem]",
        xl: "h-14 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
