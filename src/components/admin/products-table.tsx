"use client";

import { useMemo, useState } from "react";

import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { DeleteConfirmButton } from "@/components/admin/delete-confirm-button";
import { ToggleButton } from "@/components/admin/toggle-button";
import { formatMoney } from "@/lib/admin/format";
import { filterProducts } from "@/lib/admin/product-search";
import {
  deleteProduct,
  toggleProductAvailability,
} from "@/lib/actions/products";
import type { Prisma } from "@/generated/prisma/client";

type ProductRow = {
  id: string;
  nameFr: string;
  nameAr: string;
  size: string;
  sku: string | null;
  price: Prisma.Decimal;
  salePrice: Prisma.Decimal | null;
  isAvailable: boolean;
  categoryId: string;
};

export function ProductsTable({
  products,
  categories,
}: {
  products: ProductRow[];
  categories: { id: string; nameFr: string }[];
}) {
  const [query, setQuery] = useState("");
  const { results } = useMemo(
    () => filterProducts(products, query),
    [products, query],
  );

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher par nom, taille ou code-barres…"
        aria-label="Rechercher un produit"
        className="h-10 w-full max-w-md rounded-md border border-black/15 bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
      />
      {query.trim() !== "" ? (
        <p className="text-sm text-muted-foreground" role="status">
          {results.length} produit{results.length > 1 ? "s" : ""}
        </p>
      ) : null}
      <div className="overflow-hidden rounded-lg border border-black/10">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Taille</TableHead>
              <TableHead>Code-barres</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Prix promo</TableHead>
              <TableHead>Dispo.</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((product) => {
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
                  <TableCell>{product.sku?.trim() ? product.sku : "—"}</TableCell>
                  <TableCell>{formatMoney(product.price)}</TableCell>
                  <TableCell>
                    {product.salePrice ? formatMoney(product.salePrice) : "—"}
                  </TableCell>
                  <TableCell>
                    <ToggleButton
                      action={toggleProductAvailability}
                      id={product.id}
                      isActive={product.isAvailable}
                      activeLabel="🔴 Rupture de stock"
                      inactiveLabel="🟢 En stock"
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
    </div>
  );
}
