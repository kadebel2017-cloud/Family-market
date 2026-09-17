import type { Metadata } from "next";

import { ProductForm } from "@/components/admin/product-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/auth/dal";
import { safeQuery } from "@/lib/admin/queries";
import { db } from "@/lib/db";
import { createProduct } from "@/lib/actions/products";

export const metadata: Metadata = {
  title: "Nouveau produit",
};

export default async function AdminProductNewPage() {
  await requireAdmin();

  const categories = await safeQuery(
    () =>
      db.category.findMany({
        orderBy: { nameFr: "asc" },
        select: { id: true, nameFr: true, nameAr: true },
      }),
    [],
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8">
      <AdminPageHeader
        title="Nouveau produit"
        description="Ajoutez un produit au catalogue."
      />

      {categories.length === 0 ? (
        <div className="rounded-md border border-dashed border-black/15 p-6 text-center text-sm text-muted-foreground">
          Créez d&apos;abord au moins une catégorie avant d&apos;ajouter un produit.
        </div>
      ) : (
        <ProductForm action={createProduct} categories={categories} />
      )}
    </div>
  );
}