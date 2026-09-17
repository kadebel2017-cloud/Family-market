import type { Metadata } from "next";

import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DeleteConfirmButton } from "@/components/admin/delete-confirm-button";
import { EmptyState } from "@/components/admin/empty-state";
import { ToggleButton } from "@/components/admin/toggle-button";
import { requireAdmin } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { safeQuery } from "@/lib/admin/queries";
import { deleteCategory, toggleCategoryActive } from "@/lib/actions/categories";

export const metadata: Metadata = {
  title: "Catégories",
};

async function dbCategoryList() {
  return db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { nameFr: "asc" }],
    select: {
      id: true,
      nameFr: true,
      nameAr: true,
      isActive: true,
      sortOrder: true,
      _count: { select: { products: true } },
    },
  });
}

const NO_CATEGORIES = [] as Awaited<ReturnType<typeof dbCategoryList>>;

export default async function AdminCategoriesPage() {
  await requireAdmin();

  const categories = await safeQuery(() => dbCategoryList(), NO_CATEGORIES);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8">
      <AdminPageHeader
        title="Catégories"
        description="Organisez les produits par rayons."
      >
        <Button href="/admin/categories/new" size="md">
          Nouvelle catégorie
        </Button>
      </AdminPageHeader>

      {categories.length === 0 ? (
        <EmptyState
          title="Aucune catégorie"
          description="Créez votre première catégorie pour organiser les produits."
        >
          <Button href="/admin/categories/new" size="md">
            Nouvelle catégorie
          </Button>
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-lg border border-black/10">
          <Table className="min-w-[560px]">
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Produits</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="font-medium">{category.nameFr}</div>
                    <div dir="rtl" className="text-sm text-muted-foreground">
                      {category.nameAr}
                    </div>
                  </TableCell>
                  <TableCell>{category.sortOrder}</TableCell>
                  <TableCell>{category._count.products}</TableCell>
                  <TableCell>
                    <ToggleButton
                      action={toggleCategoryActive}
                      isActive={category.isActive}
                      activeLabel="Désactiver"
                      inactiveLabel="Activer"
                      id={category.id}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        href={`/admin/categories/${category.id}`}
                      >
                        Modifier
                      </Button>
                      <DeleteConfirmButton
                        action={deleteCategory}
                        id={category.id}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}