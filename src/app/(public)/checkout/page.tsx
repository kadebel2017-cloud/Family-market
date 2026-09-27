import type { Metadata } from "next";

import { getLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/translations";
import { getCheckoutWilayas, getDeliveryConfig, getFreeDeliveryRule, isDeliveryEnabled } from "@/lib/delivery";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: t(locale, "checkoutTitle") };
}

export default async function CheckoutPage() {
  const [locale, config, freeRule, deliveryEnabled] = await Promise.all([
    getLocale(),
    getDeliveryConfig(),
    getFreeDeliveryRule(),
    isDeliveryEnabled(),
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <CheckoutForm
        locale={locale}
        wilayas={getCheckoutWilayas(config.prices.map((price) => price.code))}
        prices={config.prices}
        freeRule={freeRule}
        deliveryEnabled={deliveryEnabled}
      />
    </div>
  );
}
