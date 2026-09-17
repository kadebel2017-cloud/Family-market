"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/dal";
import {
  checkboxBool,
  optionalText,
  parseDate,
  parseId,
  parseRequiredText,
  prismaError,
} from "./helpers";
import type { FormState } from "./types";

const ADMIN_PROMOTIONS_PATH = "/admin/promotions";
const ADMIN_PRODUCTS_PATH = "/admin/products";

export async function createPromotion(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const titleFr = parseRequiredText(formData, "titleFr", "Le titre (FR)");
  if (!titleFr.ok) return { error: titleFr.error };
  const titleAr = parseRequiredText(formData, "titleAr", "Le titre (AR)");
  if (!titleAr.ok) return { error: titleAr.error };

  const startDate = parseDate(formData.get("startDate"), "La date de début");
  if (!startDate.ok) return { error: startDate.error };
  const endDate = parseDate(formData.get("endDate"), "La date de fin");
  if (!endDate.ok) return { error: endDate.error };
  if (endDate.value <= startDate.value) {
    return { error: "La date de fin doit être après la date de début." };
  }

  const productIds = formData
    .getAll("productIds")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  try {
    await db.promotion.create({
      data: {
        titleFr: titleFr.value,
        titleAr: titleAr.value,
        descriptionFr: optionalText(formData, "descriptionFr"),
        descriptionAr: optionalText(formData, "descriptionAr"),
        image: optionalText(formData, "image"),
        startDate: startDate.value,
        endDate: endDate.value,
        isActive: checkboxBool(formData, "isActive"),
        products: {
          create: productIds.map((productId) => ({ productId })),
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

  const titleFr = parseRequiredText(formData, "titleFr", "Le titre (FR)");
  if (!titleFr.ok) return { error: titleFr.error };
  const titleAr = parseRequiredText(formData, "titleAr", "Le titre (AR)");
  if (!titleAr.ok) return { error: titleAr.error };

  const startDate = parseDate(formData.get("startDate"), "La date de début");
  if (!startDate.ok) return { error: startDate.error };
  const endDate = parseDate(formData.get("endDate"), "La date de fin");
  if (!endDate.ok) return { error: endDate.error };
  if (endDate.value <= startDate.value) {
    return { error: "La date de fin doit être après la date de début." };
  }

  const productIds = formData
    .getAll("productIds")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  try {
    await db.promotion.update({
      where: { id: id.value },
      data: {
        titleFr: titleFr.value,
        titleAr: titleAr.value,
        descriptionFr: optionalText(formData, "descriptionFr"),
        descriptionAr: optionalText(formData, "descriptionAr"),
        image: optionalText(formData, "image"),
        startDate: startDate.value,
        endDate: endDate.value,
        isActive: checkboxBool(formData, "isActive"),
        products: {
          deleteMany: {},
          create: productIds.map((productId) => ({ productId })),
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
