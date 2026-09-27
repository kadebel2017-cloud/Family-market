// Client-safe order constants (no server imports).
// Server modules may re-export these for convenience.

import type { DeliveryType, OrderStatus } from "@/generated/prisma/enums";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "Nouvelle",
  CONFIRMED: "Confirmée",
  PREPARING: "En préparation",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};

export const ORDER_STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  NEW: "bg-orange-100 text-orange-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PREPARING: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-cyan-100 text-cyan-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-700",
};

export const DELIVERY_TYPE_LABELS: Record<DeliveryType, string> = {
  HOME: "Livraison à domicile",
  OFFICE: "Bureau de livraison",
  FREE: "Livraison gratuite",
};
