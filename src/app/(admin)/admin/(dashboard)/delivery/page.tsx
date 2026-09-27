import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/page-header";
import {
  WilayaPriceNewForm,
  WilayaPriceRowCard,
  type WilayaPriceRow,
} from "@/components/admin/delivery/wilaya-price-forms";
import { requireAdmin } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { safeQuery } from "@/lib/admin/queries";
import {
  DeliverySettingsForm,
} from "@/components/admin/delivery/delivery-settings-form";
import {
  FreeDeliveryForm,
  type FreeDeliveryRuleValue,
} from "@/components/admin/delivery/free-delivery-form";
import {
  deleteWilayaPrice,
  saveDeliverySettings,
  saveFreeDeliveryRule,
  toggleWilayaPrice,
  upsertWilayaPrice,
} from "@/lib/actions/delivery";

export const metadata: Metadata = {
  title: "Livraison",
};

function toRow(price: {
  id: string;
  wilayaCode: string;
  wilayaName: string;
  homePrice: unknown;
  officePrice: unknown;
  isActive: boolean;
}): WilayaPriceRow {
  return {
    id: price.id,
    wilayaCode: price.wilayaCode,
    wilayaName: price.wilayaName,
    homePrice: String(price.homePrice),
    officePrice: String(price.officePrice),
    isActive: price.isActive,
  };
}

export default async function AdminDeliveryPage() {
  await requireAdmin();

  const [prices, rule, settings] = await Promise.all([
    safeQuery(
      () =>
        db.wilayaPrice.findMany({
          orderBy: { wilayaCode: "asc" },
        }),
      [],
    ),
    safeQuery(
      () => db.freeDeliveryRule.findUnique({ where: { id: "default" } }),
      null,
    ),
    safeQuery(
      () => db.deliverySettings.findUnique({ where: { id: "default" } }),
      null,
    ),
  ]);

  const ruleValue: FreeDeliveryRuleValue | null = rule
    ? {
        isEnabled: rule.isEnabled,
        threshold: String(rule.threshold),
        wilayaCode: rule.wilayaCode,
        commune: rule.commune,
        district: rule.district,
        bannerEnabled: rule.bannerEnabled,
        bannerTextFr: rule.bannerTextFr,
        bannerTextAr: rule.bannerTextAr,
      }
    : null;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8">
      <AdminPageHeader
        title="Livraison"
        description="Prix de livraison par wilaya et suivi des commandes."
      />

      <DeliverySettingsForm
        action={saveDeliverySettings}
        initialEnabled={settings?.deliveryEnabled ?? true}
      />

      <FreeDeliveryForm action={saveFreeDeliveryRule} initial={ruleValue} />

      <WilayaPriceNewForm action={upsertWilayaPrice} />

      <div className="flex flex-col gap-4">
        {prices.length === 0 ? (
          <p className="rounded-lg border border-black/10 bg-surface p-5 text-sm text-muted-foreground">
            Aucun prix configuré. Ajoutez au moins une wilaya pour activer la commande.
          </p>
        ) : (
          prices.map((price) => (
            <WilayaPriceRowCard
              key={price.id}
              row={toRow(price)}
              updateAction={upsertWilayaPrice}
              toggleAction={toggleWilayaPrice}
              deleteAction={deleteWilayaPrice}
            />
          ))
        )}
      </div>
    </div>
  );
}
