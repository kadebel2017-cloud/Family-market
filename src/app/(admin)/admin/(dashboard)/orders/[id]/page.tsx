import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin, Phone, Truck, User } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/page-header";
import { OrderStatusForm } from "@/components/admin/orders/order-status-form";
import { requireAdmin } from "@/lib/auth/dal";
import { getOrderById } from "@/lib/orders";
import {
  DELIVERY_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
} from "@/lib/order-constants";
import { formatPublicDate } from "@/lib/public/format";
import { pickLocalized } from "@/lib/i18n/translations";

type OrderDetailParams = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: OrderDetailParams): Promise<Metadata> {
  const { id } = await params;
  const order = await getOrderById(id);
  return { title: order ? `Commande ${order.orderNumber}` : "Commande introuvable" };
}

export default async function AdminOrderDetailPage({ params }: OrderDetailParams) {
  await requireAdmin();
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8">
      <Link
        href="/admin/orders"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Retour aux commandes
      </Link>

      <AdminPageHeader
        title={`Commande ${order.orderNumber}`}
        description={`${formatPublicDate("fr", order.createdAt)}`}
      >
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${ORDER_STATUS_STYLES[order.status]}`}
        >
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </AdminPageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="rounded-lg border border-black/10 bg-surface p-5 shadow-sm">
            <h2 className="text-base font-bold text-foreground">Articles</h2>
            {(() => {
              const packGroups = new Map<
                string,
                { title: string; lines: typeof order.items }
              >();
              const loose: typeof order.items = [];
              for (const item of order.items) {
                if (item.promotionId) {
                  const existing = packGroups.get(item.promotionId);
                  const title = pickLocalized(
                    "fr",
                    item.promotionTitleFr,
                    item.promotionTitleAr,
                  );
                  if (existing) {
                    existing.lines.push(item);
                  } else {
                    packGroups.set(item.promotionId, { title, lines: [item] });
                  }
                } else {
                  loose.push(item);
                }
              }
              const renderLine = (item: (typeof order.items)[number]) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-foreground">
                      {pickLocalized("fr", item.productNameFr, item.productNameAr)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.quantity} × {item.unitPrice} DA
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold text-foreground">
                    {item.lineTotal} DA
                  </span>
                </li>
              );
              return (
                <>
                  {[...packGroups.values()].map((group) => (
                    <div key={group.lines[0].promotionId} className="mt-3 rounded-md border border-gold-500/50 bg-gold-50/50 px-3 py-1">
                      <p className="pt-1 text-[11px] font-bold uppercase tracking-wide text-gold-600">
                        Pack — {group.title}
                      </p>
                      <ul className="divide-y divide-black/10">
                        {group.lines.map(renderLine)}
                      </ul>
                    </div>
                  ))}
                  <ul className="mt-3 divide-y divide-black/10">
                    {loose.map(renderLine)}
                  </ul>
                </>
              );
            })()}
            <dl className="mt-3 space-y-1.5 border-t border-black/10 pt-3 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <dt>Sous-total</dt>
                <dd>{order.subtotal} DA</dd>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <dt>Livraison</dt>
                <dd>{order.deliveryFee} DA</dd>
              </div>
              <div className="flex items-center justify-between text-base font-bold text-foreground">
                <dt>Total</dt>
                <dd>{order.total} DA</dd>
              </div>
            </dl>
          </section>

          {order.notes ? (
            <section className="rounded-lg border border-black/10 bg-surface p-5 shadow-sm">
              <h2 className="text-base font-bold text-foreground">Notes</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                {order.notes}
              </p>
            </section>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          <section className="rounded-lg border border-black/10 bg-surface p-5 shadow-sm">
            <h2 className="text-base font-bold text-foreground">Client & livraison</h2>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li className="flex items-center gap-2.5">
                <User className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                {order.customerName}
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span dir="ltr">{order.phone}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span>{DELIVERY_TYPE_LABELS[order.deliveryType]}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span>
                  {order.address ? <span className="block">{order.address}</span> : null}
                  <span className="block text-muted-foreground">
                    {order.commune}, {order.wilayaCode} {order.wilayaName}
                  </span>
                </span>
              </li>
            </ul>
          </section>

          <section className="rounded-lg border border-black/10 bg-surface p-5 shadow-sm">
            <h2 className="mb-3 text-base font-bold text-foreground">Statut</h2>
            <OrderStatusForm orderId={order.id} currentStatus={order.status} />
          </section>
        </div>
      </div>
    </div>
  );
}
