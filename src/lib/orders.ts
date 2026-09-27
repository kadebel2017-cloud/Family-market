import "server-only";

import { db } from "@/lib/db";
import { safeQuery } from "@/lib/admin/queries";
import type { DeliveryType, OrderStatus } from "@/generated/prisma/enums";

export {
  DELIVERY_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
} from "./order-constants";

export interface OrderItemSummary {
  id: string;
  productId: string | null;
  productNameFr: string;
  productNameAr: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  promotionId: string | null;
  promotionTitleFr: string | null;
  promotionTitleAr: string | null;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  wilayaCode: string;
  wilayaName: string;
  commune: string;
  address: string | null;
  deliveryType: DeliveryType;
  notes: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  items: OrderItemSummary[];
}

function toNumber(value: unknown): number {
  const parsed = Number.parseFloat(String(value ?? "0"));
  return Number.isNaN(parsed) ? 0 : parsed;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toOrderSummary(order: any): OrderSummary {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    phone: order.phone,
    wilayaCode: order.wilayaCode,
    wilayaName: order.wilayaName,
    commune: order.commune,
    address: order.address,
    deliveryType: order.deliveryType,
    notes: order.notes,
    subtotal: toNumber(order.subtotal),
    deliveryFee: toNumber(order.deliveryFee),
    total: toNumber(order.total),
    status: order.status,
    createdAt:
      order.createdAt instanceof Date
        ? order.createdAt.toISOString()
        : String(order.createdAt),
    items: (order.items ?? []).map(
      (item: OrderItemSummary & { unitPrice: unknown; lineTotal: unknown }) => ({
        id: item.id,
        productId: item.productId,
        productNameFr: item.productNameFr,
        productNameAr: item.productNameAr,
        unitPrice: toNumber(item.unitPrice),
        quantity: item.quantity,
        lineTotal: toNumber(item.lineTotal),
        promotionId: item.promotionId,
        promotionTitleFr: item.promotionTitleFr,
        promotionTitleAr: item.promotionTitleAr,
      }),
    ),
  };
}

const orderInclude = {
  items: { orderBy: { id: "asc" as const } },
};

export async function getOrderByNumber(orderNumber: string): Promise<OrderSummary | null> {
  const order = await safeQuery(
    () =>
      db.order.findUnique({
        where: { orderNumber: orderNumber.trim() },
        include: orderInclude,
      }),
    null,
  );
  return order ? toOrderSummary(order) : null;
}

export async function getOrderById(id: string): Promise<OrderSummary | null> {
  const order = await safeQuery(
    () => db.order.findUnique({ where: { id }, include: orderInclude }),
    null,
  );
  return order ? toOrderSummary(order) : null;
}

export async function listOrders(input: {
  status?: OrderStatus | "ALL";
  search?: string;
}): Promise<OrderSummary[]> {
  const status = input.status && input.status !== "ALL" ? input.status : undefined;
  const search = input.search?.trim();
  const orders = await safeQuery(
    () =>
      db.order.findMany({
        where: {
          ...(status ? { status } : {}),
          ...(search
            ? {
                OR: [
                  { orderNumber: { contains: search, mode: "insensitive" } },
                  { customerName: { contains: search, mode: "insensitive" } },
                  { phone: { contains: search } },
                ],
              }
            : {}),
        },
        include: orderInclude,
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    [],
  );
  return orders.map(toOrderSummary);
}

export async function countOrders(): Promise<{ total: number; fresh: number }> {
  const [total, fresh] = await Promise.all([
    safeQuery(() => db.order.count(), 0),
    safeQuery(() => db.order.count({ where: { status: "NEW" } }), 0),
  ]);
  return { total, fresh };
}
