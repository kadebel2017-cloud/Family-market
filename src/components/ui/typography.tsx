import * as React from "react";
import { cn } from "@/lib/utils";

type HeadingLevel = "h1" | "h2" | "h3" | "h4";

const headingSizeClasses: Record<HeadingLevel, string> = {
  h1: "text-2xl font-bold text-foreground sm:text-3xl",
  h2: "text-xl font-bold text-foreground sm:text-2xl",
  h3: "text-lg font-semibold text-foreground",
  h4: "text-base font-semibold text-foreground",
};

export function Heading({
  as: Tag = "h2",
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { as?: HeadingLevel }) {
  return <Tag className={cn(headingSizeClasses[Tag], className)} {...props} />;
}

type TextVariant = "default" | "muted" | "small" | "lead";

const textVariantClasses: Record<TextVariant, string> = {
  default: "text-base text-foreground",
  muted: "text-base text-muted-foreground",
  small: "text-sm text-muted-foreground",
  lead: "text-xl text-foreground/90",
};

export function Text({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & { variant?: TextVariant }) {
  return <p className={cn(textVariantClasses[variant], className)} {...props} />;
}