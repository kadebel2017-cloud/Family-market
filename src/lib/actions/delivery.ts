"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/dal";
import { ALGERIA_WILAYAS } from "@/data/algeria-wilayas";
import {
  checkboxBool,
  optionalText,
  parseId,
  parseRequiredDecimal,
  parseRequiredText,
  prismaError,
} from "./helpers";
import type { FormState } from "./types";

const ADMIN_DELIVERY_PATH = "/admin/delivery";

function revalidateDelivery(): void {
  revalidatePath(ADMIN_DELIVERY_PATH);
  revalidatePath("/checkout");
}

// Creates or updates the price row for one wilaya (same UX as the
// Saada Shop wilaya-prices page, but these prices ARE used by checkout).
export async function upsertWilayaPrice(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const rawCode = formData.get("wilayaCode");
  const wilayaCode = typeof rawCode === "string" ? rawCode.trim() : "";
  const entry = ALGERIA_WILAYAS.find((wilaya) => wilaya.code === wilayaCode);
  if (!entry) {
    return { error: "Wilaya invalide." };
  }
  const homePrice = parseRequiredDecimal(formData.get("homePrice"), "Le prix à domicile");
  if (!homePrice.ok) {
    return { error: homePrice.error };
  }
  const officePrice = parseRequiredDecimal(formData.get("officePrice"), "Le prix au bureau");
  if (!officePrice.ok) {
    return { error: officePrice.error };
  }

  try {
    await db.wilayaPrice.upsert({
      where: { wilayaCode },
      update: {
        wilayaName: entry.name,
        homePrice: homePrice.value,
        officePrice: officePrice.value,
        isActive: checkboxBool(formData, "isActive"),
      },
      create: {
        wilayaCode,
        wilayaName: entry.name,
        homePrice: homePrice.value,
        officePrice: officePrice.value,
        isActive: checkboxBool(formData, "isActive"),
      },
    });
    revalidateDelivery();
    return { ok: true };
  } catch (error) {
    return {
      error: prismaError(error, "Impossible d'enregistrer le prix."),
    };
  }
}

export async function toggleWilayaPrice(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const id = parseId(formData.get("id"));
  if (!id.ok) {
    return { error: id.error };
  }
  const active = formData.get("active") === "1";

  try {
    await db.wilayaPrice.update({
      where: { id: id.value },
      data: { isActive: !active },
    });
    revalidateDelivery();
    return { ok: true };
  } catch (error) {
    return {
      error: prismaError(error, "Impossible de changer le statut."),
    };
  }
}

export async function saveDeliverySettings(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  try {
    await db.deliverySettings.upsert({
      where: { id: "default" },
      update: { deliveryEnabled: checkboxBool(formData, "deliveryEnabled") },
      create: {
        id: "default",
        deliveryEnabled: checkboxBool(formData, "deliveryEnabled"),
      },
    });
    revalidateDelivery();
    return { ok: true };
  } catch (error) {
    return {
      error: prismaError(error, "Impossible d'enregistrer le paramètre."),
    };
  }
}

export async function saveFreeDeliveryRule(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const rawCode = formData.get("wilayaCode");
  const wilayaCode = typeof rawCode === "string" ? rawCode.trim() : "";
  const entry = ALGERIA_WILAYAS.find((wilaya) => wilaya.code === wilayaCode);
  if (!entry) {
    return { error: "Wilaya invalide." };
  }
  const commune = parseRequiredText(formData, "commune", "La commune");
  if (!commune.ok) {
    return { error: commune.error };
  }
  // The commune must belong to the chosen wilaya.
  const communeNorm = commune.value.toLowerCase().trim();
  const official = entry.communes.find(
    (name) => name.toLowerCase().trim() === communeNorm,
  );
  if (!official) {
    return { error: "Cette commune n'appartient pas à la wilaya choisie." };
  }
  const district = parseRequiredText(formData, "district", "Le quartier / adresse");
  if (!district.ok) {
    return { error: district.error };
  }
  const threshold = parseRequiredDecimal(formData.get("threshold"), "Le seuil");
  if (!threshold.ok) {
    return { error: threshold.error };
  }
  if (threshold.value.lessThanOrEqualTo(0)) {
    return { error: "Le seuil doit être supérieur à 0." };
  }
  const ruleEnabled = checkboxBool(formData, "isEnabled");
  // The banner can only live while the rule itself is ON.
  const bannerEnabled = ruleEnabled && checkboxBool(formData, "bannerEnabled");

  try {
    await db.freeDeliveryRule.upsert({
      where: { id: "default" },
      update: {
        isEnabled: ruleEnabled,
        threshold: threshold.value,
        wilayaCode,
        wilayaName: entry.name,
        commune: official,
        district: district.value,
        bannerEnabled,
        bannerTextFr: optionalText(formData, "bannerTextFr"),
        bannerTextAr: optionalText(formData, "bannerTextAr"),
      },
      create: {
        id: "default",
        isEnabled: ruleEnabled,
        threshold: threshold.value,
        wilayaCode,
        wilayaName: entry.name,
        commune: official,
        district: district.value,
        bannerEnabled,
        bannerTextFr: optionalText(formData, "bannerTextFr"),
        bannerTextAr: optionalText(formData, "bannerTextAr"),
      },
    });
    revalidateDelivery();
    return { ok: true };
  } catch (error) {
    return {
      error: prismaError(error, "Impossible d'enregistrer la règle."),
    };
  }
}

export async function deleteWilayaPrice(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const id = parseId(formData.get("id"));
  if (!id.ok) {
    return { error: id.error };
  }

  try {
    await db.wilayaPrice.delete({ where: { id: id.value } });
    revalidateDelivery();
    return { ok: true };
  } catch (error) {
    return {
      error: prismaError(error, "Impossible de supprimer ce prix."),
    };
  }
}
