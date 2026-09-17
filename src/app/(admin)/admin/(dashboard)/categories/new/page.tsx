import type { Metadata } from "next";

import { CategoryForm } from "@/components/admin/category-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/auth/dal";
import { createCategory } from "@/lib/actions/categories";

export const metadata: Metadata = {
  title: "Nouvelle catégorie",
};

export default async function AdminCategoryNewPage() {
  await requireAdmin();

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8">
      <AdminPageHeader
        title="Nouvelle catégorie"
        description="Ajoutez un rayon au catalogue."
      />
      <CategoryForm action={createCategory} />
    </div>
  );
}