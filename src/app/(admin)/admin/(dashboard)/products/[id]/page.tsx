import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductForm, type ProductFormInitial } from "@/components/admin/product-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { updateProduct } from "@/lib/actions/products";

export const metadata: Metadata = {
  title: "Modifier le produit",
};

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const product = await db.product.findUnique({ where: { id } });

  if (!product) {
    notFound();
  }

  const categories = await db.category.findMany({
    orderBy: { nameFr: "asc" },
    select: { id: true, nameFr: true, nameAr: true },
  });

  const initial: ProductFormInitial = {
    id: product.id,
    nameFr: product.nameFr,
    nameAr: product.nameAr,
    slug: product.slug,
    descriptionFr: product.descriptionFr,
    descriptionAr: product.descriptionAr,
    size: product.size,
    sku: product.sku,
    price: product.price.toString(),
    salePrice: product.salePrice?.toString() ?? null,
    image: product.image,
    isAvailable: product.isAvailable,
    categoryId: product.categoryId,
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8">
      <AdminPageHeader title="Modifier le produit" description={product.nameFr} />
      <ProductForm
        action={updateProduct}
        categories={categories}
        initial={initial}
      />
    </div>
  );
}