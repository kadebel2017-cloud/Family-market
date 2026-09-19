"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/dal";
import {
  calcPackTotals,
  formatDecimal,
  parsePromotionType,
  type PromotionType,
} from "@/lib/promotions";
import { Prisma } from "@/generated/prisma/client";
import {
  checkboxBool,
  optionalText,
  parseDate,
  parseDecimal,
  parseId,
  parseRequiredText,
  prismaError,
} from "./helpers";
import type { FormState } from "./types";

const ADMIN_PROMOTIONS_PATH = "/admin/promotions";
const ADMIN_PRODUCTS_PATH = "/admin/products";

interface PromotionLineInput {
  productId: string;
  quantity: number;
  promoPrice: Prisma.Decimal | null;
}

type ParsedLines = { ok: true; value: PromotionLineInput[] } | { ok: false; error: string };

function parsePromotionLines(formData: FormData): ParsedLines {
  const productIds = [
    ...new Set(
      formData
        .getAll("productIds")
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter(Boolean),
    ),
  ];
  const lines: PromotionLineInput[] = [];
  for (const productId of productIds) {
    const rawQty = formData.get(`quantity_${productId}`);
    let quantity = 1;
    if (rawQty !== null && String(rawQty).trim() !== "") {
      quantity = Number.parseInt(String(rawQty), 10);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) {
        return { ok: false, error: "La quantité doit être un nombre entier entre 1 et 999." };
      }
    }
    const promo = parseDecimal(
      formData.get(`promoPrice_${productId}`),
      false,
      "Le prix promo",
    );
    if (!promo.ok) return { ok: false, error: promo.error };
    lines.push({ productId, quantity, promoPrice: promo.value });
  }
  return { ok: true, value: lines };
}

function parseBaseFields(formData: FormData):
  | { ok: true; value: { titleFr: string; titleAr: string; startDate: Date; endDate: Date } }
  | { ok: false; error: string } {
  const titleFr = parseRequiredText(formData, "titleFr", "Le titre (FR)");
  if (!titleFr.ok) return { ok: false, error: titleFr.error };
  const titleAr = parseRequiredText(formData, "titleAr", "Le titre (AR)");
  if (!titleAr.ok) return { ok: false, error: titleAr.error };

  const startDate = parseDate(formData.get("startDate"), "La date de début");
  if (!startDate.ok) return { ok: false, error: startDate.error };
  const endDate = parseDate(formData.get("endDate"), "La date de fin");
  if (!endDate.ok) return { ok: false, error: endDate.error };
  if (endDate.value <= startDate.value) {
    return { ok: false, error: "La date de fin doit être après la date de début." };
  }
  return {
    ok: true,
    value: { titleFr: titleFr.value, titleAr: titleAr.value, startDate: startDate.value, endDate: endDate.value },
  };
}

async function resolveLines(
  lines: PromotionLineInput[],
  type: PromotionType,
  rawPackPrice: FormDataEntryValue | null,
): Promise<
  | { ok: true; value: { lines: PromotionLineInput[]; packPrice: Prisma.Decimal | null } }
  | { ok: false; error: string }
> {
  if (type === "PACK") {
    if (lines.length === 0) {
      return { ok: false, error: "Un pack doit contenir au moins un produit." };
    }
    // Read real prices from the database — Product.price is never modified.
    const products = await db.product.findMany({
      where: { id: { in: lines.map((line) => line.productId) } },
      select: { id: true, price: true },
    });
    if (products.length !== lines.length) {
      return { ok: false, error: "Un produit sélectionné n'existe plus." };
    }
    const priceById = new Map(products.map((p) => [p.id, p.price]));
    const packPrice = parseDecimal(rawPackPrice, true, "Le prix du pack");
    if (!packPrice.ok) return { ok: false, error: packPrice.error };
    if (packPrice.value === null || packPrice.value.lte(0)) {
      return { ok: false, error: "Le prix du pack doit être supérieur à 0." };
    }
    const { normalTotal } = calcPackTotals(
      lines.map((line) => ({
        unitPrice: priceById.get(line.productId)!,
        quantity: line.quantity,
      })),
      packPrice.value,
    );
    if (packPrice.value.gt(normalTotal)) {
      return {
        ok: false,
        error: `Le prix du pack ne peut pas dépasser le total normal (${formatDecimal(normalTotal)} DA).`,
      };
    }
    return {
      ok: true,
      value: {
        lines: lines.map((line) => ({ ...line, promoPrice: null })),
        packPrice: packPrice.value,
      },
    };
  }
  return {
    ok: true,
    value: {
      lines: lines.map((line) => ({ ...line, quantity: 1 })),
      packPrice: null,
    },
  };
}

export async function createPromotion(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const base = parseBaseFields(formData);
  if (!base.ok) return { error: base.error };
  const type = parsePromotionType(formData.get("type")) ?? "PRODUCT_DISCOUNT";

  const parsedLines = parsePromotionLines(formData);
  if (!parsedLines.ok) return { error: parsedLines.error };
  const resolved = await resolveLines(parsedLines.value, type, formData.get("packPrice"));
  if (!resolved.ok) return { error: resolved.error };

  try {
    await db.promotion.create({
      data: {
        titleFr: base.value.titleFr,
        titleAr: base.value.titleAr,
        descriptionFr: optionalText(formData, "descriptionFr"),
        descriptionAr: optionalText(formData, "descriptionAr"),
        image: optionalText(formData, "image"),
        startDate: base.value.startDate,
        endDate: base.value.endDate,
        isActive: checkboxBool(formData, "isActive"),
        type,
        packPrice: resolved.value.packPrice,
        products: {
          create: resolved.value.lines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            promoPrice: line.promoPrice,
          })),
        },
      },
    });

    revalidatePath(ADMIN_PROMOTIONS_PATH);
    revalidatePath(ADMIN_PRODUCTS_PATH);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return {
      error: prismaError(error, "Impossible de créer la promotion."),
    };
  }
}

export async function updatePromotion(
  prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = parseId(formData.get("id"));
  if (!id.ok) return { error: id.error };

  const base = parseBaseFields(formData);
  if (!base.ok) return { error: base.error };
  const type = parsePromotionType(formData.get("type")) ?? "PRODUCT_DISCOUNT";

  const parsedLines = parsePromotionLines(formData);
  if (!parsedLines.ok) return { error: parsedLines.error };
  const resolved = await resolveLines(parsedLines.value, type, formData.get("packPrice"));
  if (!resolved.ok) return { error: resolved.error };

  try {
    await db.promotion.update({
      where: { id: id.value },
      data: {
        titleFr: base.value.titleFr,
        titleAr: base.value.titleAr,
        descriptionFr: optionalText(formData, "descriptionFr"),
        descriptionAr: optionalText(formData, "descriptionAr"),
        image: optionalText(formData, "image"),
        startDate: base.value.startDate,
        endDate: base.value.endDate,
        isActive: checkboxBool(formData, "isActive"),
        type,
        packPrice: resolved.value.packPrice,
        products: {
          deleteMany: {},
          create: resolved.value.lines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            promoPrice: line.promoPrice,
          })),
        },
      },
    });

    revalidatePath(ADMIN_PROMOTIONS_PATH);
    revalidatePath(ADMIN_PRODUCTS_PATH);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return {
      error: prismaError(error, "Impossible de mettre à jour la promotion."),
    };
  }
}

export async function togglePromotionActive(
  prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = parseId(formData.get("id"));
  if (!id.ok) return { error: id.error };

  const next = formData.get("next") === "1";

  try {
    await db.promotion.update({
      where: { id: id.value },
      data: { isActive: next },
    });

    revalidatePath(ADMIN_PROMOTIONS_PATH);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return {
      error: prismaError(error, "Impossible de modifier la promotion."),
    };
  }
}

export async function deletePromotion(
  prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = parseId(formData.get("id"));
  if (!id.ok) return { error: id.error };

  try {
    await db.promotion.delete({ where: { id: id.value } });

    revalidatePath(ADMIN_PROMOTIONS_PATH);
    revalidatePath(ADMIN_PRODUCTS_PATH);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return {
      error: prismaError(error, "Impossible de supprimer la promotion."),
    };
  }
}
