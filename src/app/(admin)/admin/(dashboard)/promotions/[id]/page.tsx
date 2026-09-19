import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PromotionForm, type PromotionFormInitial } from "@/components/admin/promotion-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { safeQuery } from "@/lib/admin/queries";
import { toDatetimeLocal } from "@/lib/admin/format";
import { updatePromotion } from "@/lib/actions/promotions";

export const metadata: Metadata = {
  title: "Modifier la promotion",
};

export default async function AdminPromotionEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const promotion = await db.promotion.findUnique({
    where: { id },
    select: {
      id: true,
      titleFr: true,
      titleAr: true,
      descriptionFr: true,
      descriptionAr: true,
      image: true,
      startDate: true,
      endDate: true,
      isActive: true,
      type: true,
      packPrice: true,
      products: { select: { productId: true, quantity: true, promoPrice: true } },
    },
  });

  if (!promotion) {
    notFound();
  }

  const products = await safeQuery(
    () =>
      db.product.findMany({
        orderBy: { nameFr: "asc" },
        select: { id: true, nameFr: true, nameAr: true, size: true, sku: true, price: true },
      }),
    [],
  );

  const initial: PromotionFormInitial = {
    id: promotion.id,
    titleFr: promotion.titleFr,
    titleAr: promotion.titleAr,
    descriptionFr: promotion.descriptionFr,
    descriptionAr: promotion.descriptionAr,
    image: promotion.image,
    startDate: toDatetimeLocal(promotion.startDate),
    endDate: toDatetimeLocal(promotion.endDate),
    isActive: promotion.isActive,
    type: promotion.type === "PACK" ? "PACK" : "PRODUCT_DISCOUNT",
    packPrice: promotion.packPrice?.toFixed(2) ?? null,
    productIds: promotion.products.map((product) => product.productId),
    items: promotion.products.map((product) => ({
      productId: product.productId,
      quantity: product.quantity,
      promoPrice: product.promoPrice?.toFixed(2) ?? null,
    })),
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8">
      <AdminPageHeader
        title="Modifier la promotion"
        description={promotion.titleFr}
      />
      <PromotionForm
        action={updatePromotion}
        products={products.map((product) => ({
          ...product,
          price: product.price.toFixed(2),
        }))}
        initial={initial}
      />
    </div>
  );
}