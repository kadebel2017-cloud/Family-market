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
import { StatusBadge } from "@/components/admin/status-badge";
import { ToggleButton } from "@/components/admin/toggle-button";
import { requireAdmin } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { safeQuery } from "@/lib/admin/queries";
import { formatDateTime, promotionStatus } from "@/lib/admin/format";
import { deletePromotion, togglePromotionActive } from "@/lib/actions/promotions";

export const metadata: Metadata = {
  title: "Promotions",
};

async function dbPromotionList() {
  return db.promotion.findMany({
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      titleFr: true,
      titleAr: true,
      startDate: true,
      endDate: true,
      isActive: true,
      _count: { select: { products: true } },
    },
  });
}

const NO_PROMOTIONS = [] as Awaited<ReturnType<typeof dbPromotionList>>;

export default async function AdminPromotionsPage() {
  await requireAdmin();

  const promotions = await safeQuery(() => dbPromotionList(), NO_PROMOTIONS);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8">
      <AdminPageHeader
        title="Promotions"
        description="Créez et gérez les offres commerciales."
      >
        <Button href="/admin/promotions/new" size="md">
          Nouvelle promotion
        </Button>
      </AdminPageHeader>

      {promotions.length === 0 ? (
        <EmptyState
          title="Aucune promotion"
          description="Créez votre première offre pour démarrer."
        >
          <Button href="/admin/promotions/new" size="md">
            Nouvelle promotion
          </Button>
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-lg border border-black/10">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Produits</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.map((promotion) => {
                const status = promotionStatus(promotion);
                return (
                  <TableRow key={promotion.id}>
                    <TableCell>
                      <div className="font-medium">{promotion.titleFr}</div>
                      <div dir="rtl" className="text-sm text-muted-foreground">
                        {promotion.titleAr}
                      </div>
                    </TableCell>
                    <TableCell>{promotion._count.products}</TableCell>
                    <TableCell>
                      {formatDateTime(promotion.startDate)} →{" "}
                      {formatDateTime(promotion.endDate)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          href={`/admin/promotions/${promotion.id}`}
                        >
                          Modifier
                        </Button>
                        <ToggleButton
                          action={togglePromotionActive}
                          id={promotion.id}
                          isActive={promotion.isActive}
                          activeLabel="Désactiver"
                          inactiveLabel="Activer"
                        />
                        <DeleteConfirmButton action={deletePromotion} id={promotion.id} />
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