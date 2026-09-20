import type { Metadata } from "next";

import { PromotionForm } from "@/components/admin/promotion-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { safeQuery } from "@/lib/admin/queries";
import { createPromotion } from "@/lib/actions/promotions";

export const metadata: Metadata = {
  title: "Nouvelle promotion",
};

export default async function AdminPromotionNewPage() {
  await requireAdmin();

  const products = await safeQuery(
    () =>
      db.product.findMany({
        orderBy: { nameFr: "asc" },
        select: { id: true, nameFr: true, nameAr: true, size: true, sku: true, price: true, image: true },
      }),
    [],
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8">
      <AdminPageHeader
        title="Nouvelle promotion"
        description="Définissez une offre sur un ou plusieurs produits."
      />
      <PromotionForm
        action={createPromotion}
        products={products.map((product) => ({
          ...product,
          price: product.price.toFixed(2),
        }))}
      />
    </div>
  );
}