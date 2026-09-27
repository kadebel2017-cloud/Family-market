import { Truck } from "lucide-react";

import { pickLocalized } from "@/lib/i18n/translations";
import { getFreeDeliveryRule } from "@/lib/delivery";
import type { Locale } from "@/types";

// Promotional banner at the very top of every public page. Shows only
// while the free-delivery rule AND its banner switch are both ON.
export async function PromoBanner({ locale }: { locale: Locale }) {
  const rule = await getFreeDeliveryRule();
  if (!rule || !rule.isEnabled || !rule.bannerEnabled) {
    return null;
  }
  const text = pickLocalized(locale, rule.bannerTextFr, rule.bannerTextAr);
  if (!text) {
    return null;
  }
  return (
    <div
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="flex items-center justify-center gap-2 bg-emerald-600 px-4 py-2 text-center text-[13px] font-semibold text-white sm:text-sm"
    >
      <Truck className="h-4 w-4 shrink-0" aria-hidden />
      <span>{text}</span>
    </div>
  );
}
