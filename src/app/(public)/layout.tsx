import { getLocale } from "@/lib/i18n/locale";
import { getSettings } from "@/lib/public/queries";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { BusinessJsonLd } from "@/components/public/business-jsonld";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, settings] = await Promise.all([getLocale(), getSettings()]);

  return (
    <>
      <SiteHeader settings={settings} locale={locale} />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter settings={settings} locale={locale} />
      <BusinessJsonLd settings={settings} />
    </>
  );
}