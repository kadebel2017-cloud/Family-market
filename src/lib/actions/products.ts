"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/dal";
import { slugify } from "@/lib/admin/format";
import {
  checkboxBool,
  optionalText,
  parseDecimal,
  parseId,
  parseRequiredDecimal,
  parseRequiredText,
  prismaError,
  text,
} from "./helpers";
import type { FormState } from "./types";

const ADMIN_PRODUCTS_PATH = "/admin/products";

export async function createProduct(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const nameFr = parseRequiredText(formData, "nameFr", "Le nom (FR)");
  const nameAr = parseRequiredText(formData, "nameAr", "Le nom (AR)");
  if (!nameFr.ok) return { error: nameFr.error };
  if (!nameAr.ok) return { error: nameAr.error };

  const size = parseRequiredText(formData, "size", "Taille / format (FR)");
  if (!size.ok) return { error: size.error };

  let slug = text(formData, "slug");
  if (!slug) {
    slug = slugify(nameFr.value);
  }

  const price = parseRequiredDecimal(formData.get("price"), "Le prix");
  if (!price.ok) return { error: price.error };
  const salePrice = parseDecimal(formData.get("salePrice"), false, "Le prix promo");
  if (!salePrice.ok) return { error: salePrice.error };
  if (
    salePrice.value && price.value.lessThan(salePrice.value)
  ) {
    return { error: "Le prix promo doit être inférieur ou égal au prix." };
  }

  const categoryId = parseId(formData.get("categoryId"));
  if (!categoryId.ok) return { error: categoryId.error };

  try {
    await db.product.create({
      data: {
        nameFr: nameFr.value,
        nameAr: nameAr.value,
        slug,
        descriptionFr: optionalText(formData, "descriptionFr"),
        descriptionAr: optionalText(formData, "descriptionAr"),
        size: size.value,
        sku: optionalText(formData, "sku"),
        price: price.value,
        salePrice: salePrice.value,
        image: optionalText(formData, "image"),
        isAvailable: checkboxBool(formData, "isAvailable"),
        categoryId: categoryId.value,
      },
    });

    revalidatePath(ADMIN_PRODUCTS_PATH);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return {
      error: prismaError(error, "Impossible de créer le produit."),
    };
  }
}

export async function updateProduct(
  prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = parseId(formData.get("id"));
  if (!id.ok) return { error: id.error };

  const nameFr = parseRequiredText(formData, "nameFr", "Le nom (FR)");
  const nameAr = parseRequiredText(formData, "nameAr", "Le nom (AR)");
  if (!nameFr.ok) return { error: nameFr.error };
  if (!nameAr.ok) return { error: nameAr.error };

  const size = parseRequiredText(formData, "size", "Taille / format (FR)");
  if (!size.ok) return { error: size.error };

  let slug = text(formData, "slug");
  if (!slug) {
    slug = slugify(nameFr.value);
  }

  const price = parseRequiredDecimal(formData.get("price"), "Le prix");
  if (!price.ok) return { error: price.error };
  const salePrice = parseDecimal(formData.get("salePrice"), false, "Le prix promo");
  if (!salePrice.ok) return { error: salePrice.error };
  if (
    salePrice.value && price.value.lessThan(salePrice.value)
  ) {
    return { error: "Le prix promo doit être inférieur ou égal au prix." };
  }

  const categoryId = parseId(formData.get("categoryId"));
  if (!categoryId.ok) return { error: categoryId.error };

  try {
    await db.product.update({
      where: { id: id.value },
      data: {
        nameFr: nameFr.value,
        nameAr: nameAr.value,
        slug,
        descriptionFr: optionalText(formData, "descriptionFr"),
        descriptionAr: optionalText(formData, "descriptionAr"),
        size: size.value,
        sku: optionalText(formData, "sku"),
        price: price.value,
        salePrice: salePrice.value,
        image: optionalText(formData, "image"),
        isAvailable: checkboxBool(formData, "isAvailable"),
        categoryId: categoryId.value,
      },
    });

    revalidatePath(ADMIN_PRODUCTS_PATH);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return {
      error: prismaError(error, "Impossible de mettre à jour le produit."),
    };
  }
}

export async function deleteProduct(
  prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = parseId(formData.get("id"));
  if (!id.ok) return { error: id.error };

  try {
    await db.product.delete({ where: { id: id.value } });
    revalidatePath(ADMIN_PRODUCTS_PATH);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return {
      error: prismaError(error, "Impossible de supprimer le produit."),
    };
  }
}

export async function toggleProductAvailability(
  prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = parseId(formData.get("id"));
  if (!id.ok) return { error: id.error };

  const next = formData.get("next") === "1";

  try {
    await db.product.update({
      where: { id: id.value },
      data: { isAvailable: next },
    });
    revalidatePath(ADMIN_PRODUCTS_PATH);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return {
      error: prismaError(error, "Impossible de modifier la disponibilité."),
    };
  }
}
