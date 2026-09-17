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
import { formatMoney } from "@/lib/admin/format";
import {
  deleteProduct,
  toggleProductAvailability,
} from "@/lib/actions/products";

export const metadata: Metadata = {
  title: "Produits",
};

const NO_PRODUCTS = [] as Awaited<ReturnType<typeof dbProductList>>;
const NO_CATEGORIES = [] as Awaited<ReturnType<typeof dbCategoryOptions>>;

export default async function AdminProductsPage() {
  await requireAdmin();

  const [products, categories] = await Promise.all([
    safeQuery(() => dbProductList(), NO_PRODUCTS),
    safeQuery(() => dbCategoryOptions(), NO_CATEGORIES),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8">
      <AdminPageHeader
        title="Produits"
        description="Gérez le catalogue de la boutique."
      >
        <Button href="/admin/products/new" size="md">
          Nouveau produit
        </Button>
      </AdminPageHeader>

      {products.length === 0 ? (
        <EmptyState
          title="Aucun produit"
          description="Créez votre premier produit pour commencer."
        >
          <Button href="/admin/products/new" size="md">
            Nouveau produit
          </Button>
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-lg border border-black/10">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Taille</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Prix promo</TableHead>
                <TableHead>Dispo.</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const category = categories.find(
                  (candidate) => candidate.id === product.categoryId,
                );
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="font-medium">{product.nameFr}</div>
                      <div dir="rtl" className="text-sm text-muted-foreground">
                        {product.nameAr}
                      </div>
                    </TableCell>
                    <TableCell>{category?.nameFr ?? "—"}</TableCell>
                    <TableCell>{product.size || "—"}</TableCell>
                    <TableCell>{formatMoney(product.price)}</TableCell>
                    <TableCell>
                      {product.salePrice ? formatMoney(product.salePrice) : "—"}
                    </TableCell>
                    <TableCell>
                      <ToggleButton
                        action={toggleProductAvailability}
                        id={product.id}
                        isActive={product.isAvailable}
                        activeLabel="Rendre indisponible"
                        inactiveLabel="Rendre disponible"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" href={`/admin/products/${product.id}`}>
                          Modifier
                        </Button>
                        <DeleteConfirmButton action={deleteProduct} id={product.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// Local helpers avoid a shared module so the page stays self-contained.
async function dbProductList() {
  return db.product.findMany({
    orderBy: [{ categoryId: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      nameFr: true,
      nameAr: true,
      size: true,
      price: true,
      salePrice: true,
      isAvailable: true,
      categoryId: true,
    },
  });
}

async function dbCategoryOptions() {
  return db.category.findMany({
    orderBy: { nameFr: "asc" },
    select: { id: true, nameFr: true },
  });
}