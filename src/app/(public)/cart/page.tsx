import type { Metadata } from "next";

import { getLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/translations";
import { CartView } from "@/components/cart/cart-view";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: t(locale, "cartTitle") };
}

export default async function CartPage() {
  const locale = await getLocale();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
        {t(locale, "cartTitle")}
      </h1>
      <div className="mt-6">
        <CartView locale={locale} />
      </div>
    </div>
  );
}
