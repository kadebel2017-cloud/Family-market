import type { Metadata } from "next";

import { SettingsForm, type SettingsFormInitial } from "@/components/admin/settings-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { safeQuery } from "@/lib/admin/queries";
import { updateSettings } from "@/lib/actions/settings";

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
      }
    : undefined;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8">
      <AdminPageHeader
        title="Paramètres"
        description="Informations générales affichées sur le site."
      />
      <SettingsForm action={updateSettings} initial={initial} />
    </div>
  );
}