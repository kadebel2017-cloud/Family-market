import type { Metadata } from "next";

import { Button } from "@/components/ui";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { ProductsSearchBar } from "@/components/admin/products-search-bar";
import { ProductsTable } from "@/components/admin/products-table";
import { requireAdmin } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { safeQuery } from "@/lib/admin/queries";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = {
  title: "Produits",
};

const PAGE_SIZE = 20;

type ProductsSearchParams = {
  q?: string;
  categoryId?: string;
  page?: string;
};

// Global search across name FR, name AR, size and SKU/barcode.
// The selected category is deliberately NOT part of this filter.
function buildGlobalSearchWhere(q: string): Prisma.ProductWhereInput {
  return {
    OR: [
      { nameFr: { contains: q, mode: "insensitive" } },
      { nameAr: { contains: q, mode: "insensitive" } },
      { size: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
    ],
  };
}

function productsUrl({
  q,
  categoryId,
  page,
}: {
  q?: string;
  categoryId?: string | null;
  page?: number;
}): string {
  const params = new URLSearchParams();
  if (q) {
    params.set("q", q);
  }
  if (categoryId) {
    params.set("categoryId", categoryId);
  }
  if (page && page > 1) {
    params.set("page", String(page));
  }
  const qs = params.toString();
  return qs ? `/admin/products?${qs}` : "/admin/products";
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<ProductsSearchParams>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 100);
  const isSearching = q !== "";
  const requestedCategoryId = (params.categoryId ?? "").trim();

  const categories = await safeQuery(() => dbCategoryOptions(), NO_CATEGORIES);
  const activeCategory =
    categories.find((category) => category.id === requestedCategoryId) ?? null;
  const activeCategoryId = activeCategory?.id ?? null;

  // CATEGORY browses the displayed list only.
  // SEARCH is always global: the selected category never restricts it.
  const where: Prisma.ProductWhereInput = isSearching
    ? buildGlobalSearchWhere(q)
    : activeCategoryId
      ? { categoryId: activeCategoryId }
      : {};

  const total = await safeQuery(() => db.product.count({ where }), 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), totalPages)
    : 1;

  const products = await safeQuery(
    () => dbProductPage(where, page),
    NO_PRODUCTS,
  );

  // Exact SKU/barcode hits first on the current page — never fuzzy-match a
  // barcode past its exact product.
  const lowered = q.toLowerCase();
  const ordered = isSearching
    ? [...products].sort((a, b) => {
        const aExact = a.sku?.trim().toLowerCase() === lowered ? 0 : 1;
        const bExact = b.sku?.trim().toLowerCase() === lowered ? 0 : 1;
        return aExact - bExact;
      })
    : products;

  const catalogIsEmpty = !isSearching && !activeCategoryId && total === 0;

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

      <ProductsSearchBar initialQuery={q} categoryId={activeCategoryId} />

      {categories.length > 0 ? (
        <nav aria-label="Filtrer par catégorie" className="flex flex-wrap gap-2">
          <a
            href={productsUrl({})}
            aria-current={!activeCategoryId ? "page" : undefined}
            className={
              !activeCategoryId
                ? "rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white"
                : "rounded-full border border-black/15 px-4 py-1.5 text-sm font-medium transition-colors hover:bg-black/5"
            }
          >
            Toutes les catégories
          </a>
          {categories.map((category) => {
            const isActive = category.id === activeCategoryId;
            return (
              <a
                key={category.id}
                href={productsUrl({ categoryId: category.id })}
                aria-current={isActive ? "page" : undefined}
                className={
                  isActive
                    ? "rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white"
                    : "rounded-full border border-black/15 px-4 py-1.5 text-sm font-medium transition-colors hover:bg-black/5"
                }
              >
                {category.nameFr} ({category._count.products})
              </a>
            );
          })}
        </nav>
      ) : null}

      {isSearching ? (
        <p className="text-sm text-muted-foreground" role="status">
          Recherche globale «&nbsp;{q}&nbsp;» : {total} produit
          {total > 1 ? "s" : ""} dans tout le catalogue
          {activeCategory
            ? ` (catégorie « ${activeCategory.nameFr} » ignorée)`
            : null}{" "}
          ·{" "}
          <a
            href={productsUrl({ categoryId: activeCategoryId })}
            className="font-medium text-foreground underline underline-offset-2"
          >
            Effacer la recherche
          </a>
        </p>
      ) : activeCategory ? (
        <p className="text-sm text-muted-foreground" role="status">
          Rayon «&nbsp;{activeCategory.nameFr}&nbsp;» : {total} produit
          {total > 1 ? "s" : ""} ·{" "}
          <a
            href={productsUrl({})}
            className="font-medium text-foreground underline underline-offset-2"
          >
            Toutes les catégories
          </a>
        </p>
      ) : catalogIsEmpty ? null : (
        <p className="text-sm text-muted-foreground" role="status">
          {total} produit{total > 1 ? "s" : ""} au total
        </p>
      )}

      {ordered.length === 0 ? (
        isSearching ? (
          <EmptyState
            title="Aucun résultat"
            description={`Aucun produit ne correspond à « ${q} » dans tout le catalogue.`}
          >
            <Button
              href={productsUrl({ categoryId: activeCategoryId })}
              variant="outline"
              size="md"
            >
              Effacer la recherche
            </Button>
          </EmptyState>
        ) : activeCategory ? (
          <EmptyState
            title={`Aucun produit dans « ${activeCategory.nameFr} »`}
            description="Ajoutez un produit dans ce rayon ou revenez au catalogue complet."
          >
            <div className="flex flex-wrap justify-center gap-3">
              <Button href="/admin/products/new" size="md">
                Nouveau produit
              </Button>
              <Button href={productsUrl({})} variant="outline" size="md">
                Toutes les catégories
              </Button>
            </div>
          </EmptyState>
        ) : (
          <EmptyState
            title="Aucun produit"
            description="Créez votre premier produit pour commencer."
          >
            <Button href="/admin/products/new" size="md">
              Nouveau produit
            </Button>
          </EmptyState>
        )
      ) : (
        <>
          <ProductsTable products={ordered} categories={categories} />
          {totalPages > 1 ? (
            <nav
              aria-label="Pagination des produits"
              className="flex flex-wrap items-center justify-between gap-3"
            >
              <p className="text-sm text-muted-foreground">
                Page {page} sur {totalPages} — {total} produit
                {total > 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-2">
                {page > 1 ? (
                  <Button
                    href={productsUrl({
                      q: isSearching ? q : undefined,
                      categoryId: activeCategoryId,
                      page: page - 1,
                    })}
                    variant="outline"
                    size="sm"
                  >
                    ← Précédent
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    ← Précédent
                  </Button>
                )}
                {page < totalPages ? (
                  <Button
                    href={productsUrl({
                      q: isSearching ? q : undefined,
                      categoryId: activeCategoryId,
                      page: page + 1,
                    })}
                    variant="outline"
                    size="sm"
                  >
                    Suivant →
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Suivant →
                  </Button>
                )}
              </div>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}

// Local helpers avoid a shared module so the page stays self-contained.
async function dbProductPage(where: Prisma.ProductWhereInput, page: number) {
  return db.product.findMany({
    where,
    orderBy: [{ categoryId: "asc" }, { createdAt: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      nameFr: true,
      nameAr: true,
      size: true,
      sku: true,
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
    select: {
      id: true,
      nameFr: true,
      _count: { select: { products: true } },
    },
  });
}

const NO_PRODUCTS = [] as Awaited<ReturnType<typeof dbProductPage>>;
const NO_CATEGORIES = [] as Awaited<ReturnType<typeof dbCategoryOptions>>;
