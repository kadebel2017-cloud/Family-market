import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "gold" | "black" | "outline" | "white";

const badgeVariantClasses: Record<BadgeVariant, string> = {
  gold: "bg-gold-500 text-white",
  black: "bg-black text-white",
  outline: "border border-black/20 bg-transparent text-foreground",
  white: "bg-white text-black border border-black/10",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "gold", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeVariantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}