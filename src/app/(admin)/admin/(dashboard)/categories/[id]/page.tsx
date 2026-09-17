import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CategoryForm, type CategoryFormInitial } from "@/components/admin/category-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { updateCategory } from "@/lib/actions/categories";

export const metadata: Metadata = {
  title: "Modifier la catégorie",
};

export default async function AdminCategoryEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const category = await db.category.findUnique({ where: { id } });

  if (!category) {
    notFound();
  }

  const initial: CategoryFormInitial = {
    id: category.id,
    nameFr: category.nameFr,
    nameAr: category.nameAr,
    slug: category.slug,
    descriptionFr: category.descriptionFr,
    descriptionAr: category.descriptionAr,
    image: category.image,
    isActive: category.isActive,
    sortOrder: category.sortOrder,
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8">
      <AdminPageHeader
        title="Modifier la catégorie"
        description={category.nameFr}
      />
      <CategoryForm action={updateCategory} initial={initial} />
    </div>
  );
}