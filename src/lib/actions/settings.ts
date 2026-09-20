"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/dal";
import {
  checkboxBool,
  optionalText,
  parseRequiredText,
  prismaError,
} from "./helpers";
import type { FormState } from "./types";

const ADMIN_SETTINGS_PATH = "/admin/settings";

const DEFAULT_SETTINGS_ID = "default";

export async function updateSettings(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const storeNameFr = parseRequiredText(formData, "storeNameFr", "Le nom (FR)");
  if (!storeNameFr.ok) return { error: storeNameFr.error };
  const storeNameAr = parseRequiredText(formData, "storeNameAr", "Le nom (AR)");
  if (!storeNameAr.ok) return { error: storeNameAr.error };

  const openingTime = parseRequiredText(formData, "openingTime", "L'heure d'ouverture");
  if (!openingTime.ok) return { error: openingTime.error };
  const closingTime = parseRequiredText(formData, "closingTime", "L'heure de fermeture");
  if (!closingTime.ok) return { error: closingTime.error };

  const data = {
    storeNameFr: storeNameFr.value,
    storeNameAr: storeNameAr.value,
    phone: optionalText(formData, "phone"),
    whatsapp: optionalText(formData, "whatsapp"),
    addressFr: optionalText(formData, "addressFr"),
    addressAr: optionalText(formData, "addressAr"),
    facebookUrl: optionalText(formData, "facebookUrl"),
    instagramUrl: optionalText(formData, "instagramUrl"),
    tiktokUrl: optionalText(formData, "tiktokUrl"),
    googleMapsUrl: optionalText(formData, "googleMapsUrl"),
    logoImage: optionalText(formData, "logoImage"),
    heroMedia: optionalText(formData, "heroMedia"),
    openingTime: openingTime.value,
    closingTime: closingTime.value,
    isOpenAutomatically: checkboxBool(formData, "isOpenAutomatically"),
    findStoreEnabled: checkboxBool(formData, "findStoreEnabled"),
    findStoreTitle: optionalText(formData, "findStoreTitle"),
    findStoreVideoUrl: optionalText(formData, "findStoreVideoUrl"),
  };

  try {
    const existing = await db.storeSettings.findUnique({
      where: { id: DEFAULT_SETTINGS_ID },
      select: { id: true },
    });

    if (existing) {
      await db.storeSettings.update({
        where: { id: DEFAULT_SETTINGS_ID },
        data,
      });
    } else {
      await db.storeSettings.create({
        data: { id: DEFAULT_SETTINGS_ID, ...data },
      });
    }

    revalidatePath(ADMIN_SETTINGS_PATH);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return {
      error: prismaError(error, "Impossible d'enregistrer les paramètres."),
    };
  }
}
