"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { DeliveryType, OrderStatus } from "@/generated/prisma/enums";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/dal";
import { getDeliveryConfig, getFreeDeliveryRule, getWilayaEntry, isDeliveryEnabled } from "@/lib/delivery";
import { getEffectivePriceMap } from "@/lib/pricing";
import {
  isValidPhone,
  normalizePlaceName,
  quoteFromPrices,
  type DeliveryTypeValue,
} from "@/lib/delivery-shared";

export interface PlaceOrderItem {
  productId: string;
  qty: number;
}

export interface PlaceOrderPack {
  packId: string;
  qty: number;
}

export interface PlaceOrderInput {
  customerName: string;
  phone: string;
  wilayaCode: string;
  commune: string;
  deliveryType: DeliveryTypeValue | "FREE";
  address?: string;
  notes?: string;
  items: PlaceOrderItem[];
  packs?: PlaceOrderPack[];
}

export type PlaceOrderResult =
  | { ok: true; orderNumber: string }
  | { ok: false; error: string };

function fail(error: string): PlaceOrderResult {
  return { ok: false, error };
}

function makeOrderNumber(): string {
  const time = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `FM-${time}${random}`;
}

// Creates a cash-on-delivery order. Prices and the delivery fee are
// always recomputed server-side from the database — client values are
// never trusted (same guarantee as the Saada Store checkout).
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const customerName = input.customerName?.trim() ?? "";
  const phone = input.phone?.trim() ?? "";
  const wilayaCode = input.wilayaCode?.trim() ?? "";
  const commune = input.commune?.trim() ?? "";
  const rawType = input.deliveryType;
  const deliveryType: DeliveryTypeValue | "FREE" =
    rawType === "OFFICE" ? "OFFICE" : rawType === "FREE" ? "FREE" : "HOME";
  const isFree = deliveryType === "FREE";
  const address = input.address?.trim() ?? "";
  const notes = input.notes?.trim() ?? "";
  const items = Array.isArray(input.items) ? input.items : [];
  const packs = Array.isArray(input.packs) ? input.packs : [];

  // Global service switch: no order can pass while delivery is OFF.
  // Message kept in sync with the checkout red notice (FR/AR there).
  if (!(await isDeliveryEnabled())) {
    return fail("Service de livraison bientôt disponible.");
  }
  if (customerName.length < 3) {
    return fail("Le nom complet est requis (3 caractères minimum).");
  }
  if (!isValidPhone(phone)) {
    return fail("Le numéro de téléphone est invalide.");
  }
  // FREE orders use the admin rule's locked zone — client values ignored.
  if (!isFree && !wilayaCode) {
    return fail("La wilaya est requise.");
  }
  if (!isFree && !commune) {
    return fail("La commune est requise.");
  }
  if (deliveryType === "HOME" && address.length < 5) {
    return fail("L'adresse complète est requise pour la livraison à domicile.");
  }
  if (
    items.length + packs.length === 0 ||
    items.length > 50 ||
    packs.length > 20
  ) {
    return fail("Le panier est vide ou invalide.");
  }
  for (const item of items) {
    const qty = Math.floor(Number(item.qty));
    if (!item.productId || !Number.isFinite(qty) || qty < 1 || qty > 99) {
      return fail("Le panier contient une quantité invalide.");
    }
  }
  for (const pack of packs) {
    const qty = Math.floor(Number(pack.qty));
    if (!pack.packId || !Number.isFinite(qty) || qty < 1 || qty > 99) {
      return fail("Le panier contient un pack invalide.");
    }
  }

  // Wilaya must have an admin-configured price (never invent one).
  // FREE mode skips this — its locked zone comes from the admin rule.
  const config = await getDeliveryConfig();
  const quote = isFree
    ? null
    : quoteFromPrices(config.prices, { wilayaCode, deliveryType });
  if (!isFree && (!quote || !quote.matched || !quote.zone)) {
    return fail("Cette wilaya n'est pas encore desservie. Contactez-nous.");
  }

  // Commune must belong to the wilaya's reference list (FREE is locked).
  const entry = isFree ? null : getWilayaEntry(wilayaCode);
  const communeNorm = normalizePlaceName(commune);
  if (!isFree) {
    const communeValid =
      entry?.communes.some(
        (name) => normalizePlaceName(name) === communeNorm,
      ) ?? false;
    if (!communeValid) {
      return fail("Cette commune est invalide pour la wilaya choisie.");
    }
  }

  const productIds = [...new Set(items.map((item) => item.productId))];
  let priceMap;
  try {
    priceMap = await getEffectivePriceMap(productIds);
  } catch {
    return fail("Impossible de vérifier les produits. Réessayez.");
  }
  let productRows: { id: string; nameFr: string; nameAr: string }[] = [];
  try {
    productRows = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, nameFr: true, nameAr: true },
    });
  } catch {
    return fail("Impossible de vérifier les produits. Réessayez.");
  }
  const byId = new Map(productRows.map((product) => [product.id, product]));

  let subtotal = 0;
  const lines: {
    productId: string;
    productNameFr: string;
    productNameAr: string;
    unitPrice: Prisma.Decimal;
    quantity: number;
    lineTotal: Prisma.Decimal;
    promotionId: string | null;
    promotionTitleFr: string | null;
    promotionTitleAr: string | null;
  }[] = [];

  for (const item of items) {
    const product = byId.get(item.productId);
    const effective = priceMap.get(item.productId);
    if (!product || !effective || !effective.isAvailable) {
      return fail("Un produit du panier n'est plus disponible.");
    }
    // Same rule as the product page: promos and sale prices compete,
    // lowest wins — re-validated here at order time.
    const unit = effective.unit;
    const qty = Math.floor(Number(item.qty));
    const lineTotal = unit * qty;
    subtotal += lineTotal;
    lines.push({
      productId: product.id,
      productNameFr: product.nameFr,
      productNameAr: product.nameAr,
      unitPrice: new Prisma.Decimal(unit.toFixed(2)),
      quantity: qty,
      lineTotal: new Prisma.Decimal(lineTotal.toFixed(2)),
      promotionId: null,
      promotionTitleFr: null,
      promotionTitleAr: null,
    });
  }

  // Pack lines: the promotion is re-validated here (PACK, active, dates,
  // pack price from DB). The pack price is split across included products
  // proportionally to their normal prices so the lines sum to it exactly
  // (integer-cent math with largest-remainder distribution).
  if (packs.length > 0) {
    const packIds = [...new Set(packs.map((pack) => pack.packId))];
    let promotions;
    try {
      promotions = await db.promotion.findMany({
        where: { id: { in: packIds } },
        include: { products: { include: { product: true } } },
      });
    } catch {
      return fail("Impossible de vérifier les packs. Réessayez.");
    }
    const now = new Date();
    for (const pack of packs) {
      const packQty = Math.floor(Number(pack.qty));
      const promotion = promotions.find((promo) => promo.id === pack.packId);
      if (
        !promotion ||
        promotion.type !== "PACK" ||
        !promotion.isActive ||
        promotion.packPrice === null ||
        now < promotion.startDate ||
        now > promotion.endDate ||
        promotion.products.length === 0
      ) {
        return fail("Un pack du panier n'est plus disponible.");
      }
      const packPrice = Number(promotion.packPrice);
      const packLines: {
        productId: string;
        productNameFr: string;
        productNameAr: string;
        normalCents: number;
        quantity: number;
      }[] = [];
      for (const link of promotion.products) {
        if (!link.product.isAvailable) {
          return fail("Un produit d'un pack n'est plus disponible.");
        }
        // Same "normal" definition as the public pack page: base price.
        const normalCents = Math.round(Number(link.product.price) * 100);
        packLines.push({
          productId: link.product.id,
          productNameFr: link.product.nameFr,
          productNameAr: link.product.nameAr,
          normalCents: normalCents * link.quantity,
          quantity: link.quantity * packQty,
        });
      }
      const normalSum = packLines.reduce((total, line) => total + line.normalCents, 0);
      if (normalSum <= 0 || packPrice <= 0) {
        return fail("Un pack du panier est invalide.");
      }
      const totalCents = Math.round(packPrice * 100) * packQty;
      const shares = packLines.map((line) => ({
        line,
        exact: (totalCents * line.normalCents) / normalSum,
      }));
      const floors = shares.map((share) => Math.floor(share.exact));
      let remainder = totalCents - floors.reduce((total, value) => total + value, 0);
      const order = shares
        .map((share, index) => ({ index, frac: share.exact - Math.floor(share.exact) }))
        .sort((a, b) => b.frac - a.frac);
      const lineCents = [...floors];
      for (const entry of order) {
        if (remainder <= 0) {
          break;
        }
        lineCents[entry.index] += 1;
        remainder -= 1;
      }
      shares.forEach((share, index) => {
        const cents = lineCents[index];
        lines.push({
          productId: share.line.productId,
          productNameFr: share.line.productNameFr,
          productNameAr: share.line.productNameAr,
          unitPrice: new Prisma.Decimal(
            (cents / 100 / share.line.quantity).toFixed(2),
          ),
          quantity: share.line.quantity,
          lineTotal: new Prisma.Decimal((cents / 100).toFixed(2)),
          promotionId: promotion.id,
          promotionTitleFr: promotion.titleFr,
          promotionTitleAr: promotion.titleAr,
        });
        subtotal += cents / 100;
      });
    }
  }

  if (subtotal <= 0) {
    return fail("Le montant de la commande est invalide.");
  }

  // FREE mode: rule must be ON and the threshold reached — zone values
  // always come from the admin rule, never from the browser.
  let finalWilayaCode = wilayaCode;
  let finalWilayaName = entry?.name ?? wilayaCode;
  let finalCommune =
    entry?.communes.find((name) => normalizePlaceName(name) === communeNorm) ??
    commune;
  let finalAddress: string | null = deliveryType === "OFFICE" ? null : address;
  let deliveryFee = quote ? quote.fee : 0;
  if (isFree) {
    const rule = await getFreeDeliveryRule();
    if (!rule || !rule.isEnabled || subtotal < rule.threshold) {
      return fail("La livraison gratuite n'est pas disponible pour ce panier.");
    }
    finalWilayaCode = rule.wilayaCode;
    finalWilayaName = rule.wilayaName;
    finalCommune = rule.commune;
    finalAddress = rule.district;
    deliveryFee = 0;
  }
  const total = subtotal + deliveryFee;

  const data = {
    customerName,
    phone,
    wilayaCode: finalWilayaCode,
    wilayaName: finalWilayaName,
    commune: finalCommune,
    address: finalAddress,
    deliveryType: deliveryType as DeliveryType,
    notes: notes === "" ? null : notes,
    subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
    deliveryFee: new Prisma.Decimal(deliveryFee.toFixed(2)),
    total: new Prisma.Decimal(total.toFixed(2)),
    items: { create: lines },
  };

  try {
    const order = await db.order.create({
      data: { ...data, orderNumber: makeOrderNumber() },
      select: { orderNumber: true },
    });
    return { ok: true, orderNumber: order.orderNumber };
  } catch (error) {
    // Rare order-number collision — retry once with a fresh number.
    if (error && typeof error === "object" && (error as { code?: string }).code === "P2002") {
      try {
        const order = await db.order.create({
          data: { ...data, orderNumber: makeOrderNumber() },
          select: { orderNumber: true },
        });
        return { ok: true, orderNumber: order.orderNumber };
      } catch {
        return fail("Impossible d'enregistrer la commande. Réessayez.");
      }
    }
    console.error("[orders] placeOrder", error);
    return fail("Impossible d'enregistrer la commande. Réessayez.");
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  try {
    await db.order.update({ where: { id: orderId }, data: { status } });
  } catch {
    return { ok: false, error: "Commande introuvable." };
  }
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

const ORDER_STATUS_VALUES: OrderStatus[] = [
  "NEW",
  "CONFIRMED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

// FormData wrapper for the admin order-detail status form.
export async function changeOrderStatus(
  _prev: { ok?: boolean; error?: string },
  formData: FormData,
): Promise<{ ok?: boolean; error?: string }> {
  await requireAdmin();
  const rawId = formData.get("orderId");
  const rawStatus = formData.get("status");
  const orderId = typeof rawId === "string" ? rawId.trim() : "";
  const status =
    typeof rawStatus === "string" && (ORDER_STATUS_VALUES as string[]).includes(rawStatus)
      ? (rawStatus as OrderStatus)
      : null;
  if (!orderId || !status) {
    return { error: "Statut invalide." };
  }
  return updateOrderStatus(orderId, status);
}
