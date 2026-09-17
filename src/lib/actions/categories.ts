"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/dal";
import { slugify } from "@/lib/admin/format";
import {
  checkboxBool,
  optionalText,
  parseId,
  parseRequiredText,
  parseSortOrder,
  prismaError,
  text,
} from "./helpers";
import type { FormState } from "./types";

const ADMIN_CATEGORIES_PATH = "/admin/categories";
const ADMIN_PRODUCTS_PATH = "/admin/products";

export async function createCategory(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const nameFr = parseRequiredText(formData, "nameFr", "Le nom (FR)");
  const nameAr = parseRequiredText(formData, "nameAr", "Le nom (AR)");
  if (!nameFr.ok) return { error: nameFr.error };
  if (!nameAr.ok) return { error: nameAr.error };

  const slug = text(formData, "slug") || slugify(nameFr.value);

  try {
    await db.category.create({
      data: {
        nameFr: nameFr.value,
        nameAr: nameAr.value,
        slug,
        descriptionFr: optionalText(formData, "descriptionFr"),
        descriptionAr: optionalText(formData, "descriptionAr"),
        image: optionalText(formData, "image"),
        isActive: checkboxBool(formData, "isActive"),
        sortOrder: parseSortOrder(formData.get("sortOrder")),
      },
    });

    revalidatePath(ADMIN_CATEGORIES_PATH);
    revalidatePath(ADMIN_PRODUCTS_PATH);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return {
      error: prismaError(error, "Impossible de créer la catégorie."),
    };
  }
}

export async function updateCategory(
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

  const slug = text(formData, "slug") || slugify(nameFr.value);

  try {
    await db.category.update({
      where: { id: id.value },
      data: {
        nameFr: nameFr.value,
        nameAr: nameAr.value,
        slug,
        descriptionFr: optionalText(formData, "descriptionFr"),
        descriptionAr: optionalText(formData, "descriptionAr"),
        image: optionalText(formData, "image"),
        isActive: checkboxBool(formData, "isActive"),
        sortOrder: parseSortOrder(formData.get("sortOrder")),
      },
    });

    revalidatePath(ADMIN_CATEGORIES_PATH);
    revalidatePath(ADMIN_PRODUCTS_PATH);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return {
      error: prismaError(error, "Impossible de mettre à jour la catégorie."),
    };
  }
}

export async function toggleCategoryActive(
  prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = parseId(formData.get("id"));
  if (!id.ok) return { error: id.error };

  const next = formData.get("next") === "1";

  try {
    await db.category.update({
      where: { id: id.value },
      data: { isActive: next },
    });

    revalidatePath(ADMIN_CATEGORIES_PATH);
    revalidatePath(ADMIN_PRODUCTS_PATH);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return {
      error: prismaError(error, "Impossible de modifier la catégorie."),
    };
  }
}

export async function deleteCategory(
  prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = parseId(formData.get("id"));
  if (!id.ok) return { error: id.error };

  try {
    await db.category.delete({ where: { id: id.value } });

    revalidatePath(ADMIN_CATEGORIES_PATH);
    revalidatePath(ADMIN_PRODUCTS_PATH);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return {
      error: prismaError(
        error,
        "Impossible de supprimer la catégorie (elle contient peut-être des produits).",
      ),
    };
  }
}
