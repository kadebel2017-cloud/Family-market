import { ShoppingBasket, Store, Tag } from "lucide-react";

import { cn } from "@/lib/utils";

const KIND_ICONS = {
  product: ShoppingBasket,
  category: Store,
  promotion: Tag,
} as const;

export type FallbackKind = keyof typeof KIND_ICONS;

/**
 * Static brand placeholder used whenever a product, category or promotion has
 * no uploaded media yet. Purely decorative — no animation, no fake imagery.
 * Black / white / gold, matching the Family Market identity.
 */
export function ImageFallback({
  kind = "product",
  tone = "light",
  className,
  iconClassName,
}: {
  kind?: FallbackKind;
  tone?: "light" | "dark";
  className?: string;
  iconClassName?: string;
}) {
  const Icon = KIND_ICONS[kind];

  return (
    <span
      aria-hidden
      className={cn(
        "absolute inset-0 flex items-center justify-center",
        tone === "dark" ? "bg-ink" : "bg-gold-50",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full border shadow-sm",
          tone === "dark"
            ? "border-gold-500/40 bg-white/5 text-gold-400"
            : "border-gold-200 bg-white text-gold-600",
        )}
      >
        <Icon className={cn("h-6 w-6", iconClassName)} />
      </span>
    </span>
  );
}
