"use client";

import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui";
import { t } from "@/lib/i18n/translations";
import type { Locale } from "@/types";
import { useCart, type NewCartPack } from "@/components/cart/cart-context";

export function AddPackToCart({
  pack,
  locale,
}: {
  pack: NewCartPack;
  locale: Locale;
}) {
  const router = useRouter();
  const { addPack } = useCart();

  function handleClick() {
    addPack(pack, 1);
    router.push("/cart");
  }

  return (
    <Button type="button" size="lg" className="w-full sm:w-auto" onClick={handleClick}>
      <ShoppingCart className="h-5 w-5" aria-hidden />
      {t(locale, "cartCheckout")}
    </Button>
  );
}
