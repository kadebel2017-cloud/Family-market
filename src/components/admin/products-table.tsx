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

// Presentational table only: filtering (category browsing) and global search
// are resolved server-side in the products page, so only the current result
// page is ever passed here.
export function ProductsTable({
  products,
  categories,
}: {
  products: ProductRow[];
  categories: { id: string; nameFr: string }[];
}) {
  return (
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
  );
}
