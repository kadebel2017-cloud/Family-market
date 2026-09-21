import type { Metadata } from "next";

import { SettingsForm, type SettingsFormInitial } from "@/components/admin/settings-form";
import { HeroSlidesManager } from "@/components/admin/hero/hero-slides-manager";
import { VitrineSlidesManager } from "@/components/admin/vitrine/vitrine-slides-manager";
import { AdminPageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { safeQuery } from "@/lib/admin/queries";
import { updateSettings } from "@/lib/actions/settings";
import { listHeroSlides } from "@/lib/actions/hero-slides";
import { listVitrineSlides } from "@/lib/actions/vitrine-slides";
import type { HeroSlideSummary } from "@/lib/hero/constants";
import type { VitrineSlideSummary } from "@/lib/vitrine/constants";

export const metadata: Metadata = {
  title: "Paramètres",
};

export default async function AdminSettingsPage() {
  await requireAdmin();

  const settings = await safeQuery(
    () => db.storeSettings.findUnique({ where: { id: "default" } }),
    null,
  );

  const initial: SettingsFormInitial | undefined = settings
    ? {
        storeNameFr: settings.storeNameFr,
        storeNameAr: settings.storeNameAr,
        phone: settings.phone ?? "",
        whatsapp: settings.whatsapp,
        addressFr: settings.addressFr,
        addressAr: settings.addressAr,
        facebookUrl: settings.facebookUrl,
        instagramUrl: settings.instagramUrl,
        tiktokUrl: settings.tiktokUrl,
        googleMapsUrl: settings.googleMapsUrl,
        logoImage: settings.logoImage,
        heroMedia: settings.heroMedia,
        openingTime: settings.openingTime,
        closingTime: settings.closingTime,
        isOpenAutomatically: settings.isOpenAutomatically,
        findStoreEnabled: settings.findStoreEnabled,
        findStoreTitle: settings.findStoreTitle,
        findStoreVideoUrl: settings.findStoreVideoUrl,
        aboutTitleFr: settings.aboutTitleFr,
        aboutTitleAr: settings.aboutTitleAr,
        aboutDescriptionFr: settings.aboutDescriptionFr,
        aboutDescriptionAr: settings.aboutDescriptionAr,
      }
    : undefined;

  const heroSlides: HeroSlideSummary[] = await safeQuery(
    () => listHeroSlides(),
    [],
  );

  const vitrineSlides: VitrineSlideSummary[] = await safeQuery(
    () => listVitrineSlides(),
    [],
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8">
      <AdminPageHeader
        title="Paramètres"
        description="Informations générales affichées sur le site."
      />
      <HeroSlidesManager initialSlides={heroSlides} />
      <VitrineSlidesManager initialSlides={vitrineSlides} />
      <SettingsForm action={updateSettings} initial={initial} />
    </div>
  );
}