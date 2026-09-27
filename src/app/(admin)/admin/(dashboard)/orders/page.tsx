import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { Button, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { Select } from "@/components/admin/fields";
import { requireAdmin } from "@/lib/auth/dal";
import { listOrders } from "@/lib/orders";
import {
  DELIVERY_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  ORDER_STATUSES,
} from "@/lib/order-constants";
import { formatPublicDate } from "@/lib/public/format";
import type { OrderStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = {
  title: "Commandes",
};

type OrdersParams = {
  searchParams: Promise<{ status?: string; q?: string }>;
};

function parseStatus(raw: string | undefined): OrderStatus | "ALL" {
  if (raw && (ORDER_STATUSES as string[]).includes(raw)) {
    return raw as OrderStatus;
  }
  return "ALL";
}

export default async function AdminOrdersPage({ searchParams }: OrdersParams) {
  await requireAdmin();
  const params = await searchParams;
  const status = parseStatus(params.status);
  const query = params.q?.trim() ?? "";
  const orders = await listOrders({ status, search: query });

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8">
      <AdminPageHeader
        title="Commandes"
        description={`${orders.length} commande(s). Les prix et frais de livraison sont calculés côté serveur.`}
      />

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-lg border border-black/10 bg-surface p-4 shadow-sm"
      >
        <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
          Statut
          <Select name="status" defaultValue={status}>
            <option value="ALL">Tous</option>
            {ORDER_STATUSES.map((value) => (
              <option key={value} value={value}>
                {ORDER_STATUS_LABELS[value]}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex min-w-52 flex-1 flex-col gap-1.5 text-sm font-medium text-foreground">
          Recherche
          <Input
            name="q"
            defaultValue={query}
            placeholder="N° commande, nom, téléphone…"
          />
        </label>
        <Button type="submit" variant="outline">
          Filtrer
        </Button>
      </form>

      <div className="rounded-lg border border-black/10 bg-surface shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Commande</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Livraison</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Aucune commande pour le moment.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-semibold text-gold-600 hover:text-gold-700 hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {formatPublicDate("fr", order.createdAt)} · {order.items.length} article(s)
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{order.customerName}</p>
                    <p dir="ltr" className="text-xs text-muted-foreground">{order.phone}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs">
                      {order.commune}, {order.wilayaCode} {order.wilayaName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {DELIVERY_TYPE_LABELS[order.deliveryType]} · {order.deliveryFee} DA
                    </p>
                  </TableCell>
                  <TableCell className="text-right font-bold">{order.total} DA</TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ORDER_STATUS_STYLES[order.status]}`}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
