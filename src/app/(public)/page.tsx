import type { Metadata } from "next";

import { getLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/translations";
import { getSettings, getHomeHero, getHomeData } from "@/lib/public/queries";
import { storeName } from "@/components/public/store-logo";
import { Hero } from "@/components/public/home/hero";
import { PromotionsSection } from "@/components/public/home/promotions-section";
import { CategoriesSection } from "@/components/public/home/categories-section";
import { ProductsSection } from "@/components/public/home/products-section";
import { AboutSection } from "@/components/public/home/about-section";
import { ContactSection } from "@/components/public/home/contact-section";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const settings = await getSettings();
  const hero = await getHomeHero(settings?.heroMedia ?? null);
  const name = storeName(settings, locale);
  const description = `${name} — ${t(locale, "heroTagline")} ${t(
    locale,
    "heroLead",
  )}`;

  return {
    title: name,
    description,
    alternates: { canonical: "/" },
    openGraph: {
      title: name,
      description,
      locale: locale === "ar" ? "ar_DZ" : "fr_FR",
      type: "website",
      images: hero.heroImage ? [{ url: hero.heroImage.url, alt: name }] : undefined,
    },
  };
}

export default async function HomePage() {
  const locale = await getLocale();
  const data = await getHomeData();

  return (
    <>
      <Hero
        settings={data.settings}
        slides={data.heroSlides}
        locale={locale}
      />
      <PromotionsSection promotions={data.promotions} locale={locale} />
      <CategoriesSection categories={data.categories} locale={locale} />
      <ProductsSection products={data.products} locale={locale} />
      <AboutSection settings={data.settings} locale={locale} />
      <ContactSection settings={data.settings} locale={locale} />
    </>
  );
}