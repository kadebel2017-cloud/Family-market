import { getLocale } from "@/lib/i18n/locale";
import { getSettings } from "@/lib/public/queries";
import { PromoBanner } from "@/components/public/promo-banner";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { BusinessJsonLd } from "@/components/public/business-jsonld";
import { CartProvider } from "@/components/cart/cart-context";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, settings] = await Promise.all([getLocale(), getSettings()]);

  return (
    <CartProvider>
      <PromoBanner locale={locale} />
      <SiteHeader settings={settings} locale={locale} />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter settings={settings} locale={locale} />
      <BusinessJsonLd settings={settings} />
    </CartProvider>
  );
}