import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gold-500 text-white hover:bg-gold-600 focus-visible:ring-gold-500",
  secondary: "bg-black text-white hover:bg-black/85 focus-visible:ring-black",
  outline:
    "border border-black/20 bg-transparent text-black hover:bg-black/5 focus-visible:ring-black/40",
  ghost: "bg-transparent text-black hover:bg-black/5 focus-visible:ring-black/40",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

const baseClassName =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  href,
  type,
  ...props
}: ButtonProps) {
  const classes = cn(
    baseClassName,
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  if (href) {
    return (
      <a
        href={href}
        className={classes}
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      />
    );
  }

  return <button type={type ?? "button"} className={classes} {...props} />;
}