"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/dal";
import {
  blobStorageMissingMessage,
  deleteBlobUrl,
  hasBlobStorage,
  isBlobUrl,
} from "@/lib/media/blob";
import { parseId, prismaError } from "./helpers";
import type { FormState } from "./types";

const ADMIN_MEDIA_PATH = "/admin/media";

async function findReferenceCount(url: string): Promise<number> {
  const [products, categories, promotions] = await Promise.all([
    db.product.count({ where: { image: url } }),
    db.category.count({ where: { image: url } }),
    db.promotion.count({ where: { image: url } }),
  ]);
  return products + categories + promotions;
}

async function findHeroUsage(assetId: string): Promise<number> {
  return db.heroSlide.count({ where: { mediaId: assetId } });
}

export async function deleteMediaAsset(
  prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = parseId(formData.get("id"));
  if (!id.ok) return { error: id.error };

  const asset = await db.mediaAsset.findUnique({ where: { id: id.value } });
  if (!asset) {
    return { error: "Ce média n'existe plus." };
  }

  const references = await findReferenceCount(asset.url);
  if (references > 0) {
    return {
      error:
        "Ce média est utilisé par un produit, une catégorie ou une promotion. Retirez-le d'abord de ces éléments.",
    };
  }

  const heroUsage = await findHeroUsage(asset.id);
  if (heroUsage > 0) {
    return {
      error:
        "Ce média est utilisé dans le Hero. Retirez-le d'abord du Hero (Paramètres → Hero Media).",
    };
  }

  if (isBlobUrl(asset.url)) {
    if (!hasBlobStorage()) {
      return { error: blobStorageMissingMessage() };
    }
    try {
      await deleteBlobUrl(asset.url);
    } catch (error) {
      console.error("[admin] échec de la suppression du blob", error);
      return {
        error:
          "Le fichier stocké n'a pas pu être supprimé. Réessayez ou vérifiez le stockage Blob.",
      };
    }
  }

  try {
    await db.mediaAsset.delete({ where: { id: id.value } });
    revalidatePath(ADMIN_MEDIA_PATH);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return { error: prismaError(error, "Impossible de supprimer le média.") };
  }
}