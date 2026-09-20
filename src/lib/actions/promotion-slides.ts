"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/dal";
import {
  PROMOTION_LIMIT_MESSAGE_FR,
  MAX_ACTIVE_PROMOTION_SLIDES,
  type PromotionSlideSummary,
} from "@/lib/promotion-media/constants";
import { parseId, prismaError } from "./helpers";
import type { FormState } from "./types";

function toSummary(slide: {
  id: string;
  promotionId: string;
  mediaId: string;
  sortOrder: number;
  isActive: boolean;
  media: {
    name: string;
    url: string;
    type: "image" | "video";
    altFr: string | null;
    altAr: string | null;
  };
}): PromotionSlideSummary {
  return {
    id: slide.id,
    promotionId: slide.promotionId,
    mediaId: slide.mediaId,
    name: slide.media.name,
    url: slide.media.url,
    type: slide.media.type,
    altFr: slide.media.altFr,
    altAr: slide.media.altAr,
    sortOrder: slide.sortOrder,
    isActive: slide.isActive,
  };
}

function revalidatePromotion(promotionId: string): void {
  revalidatePath(`/admin/promotions/${promotionId}`);
  revalidatePath(`/promotions/${promotionId}`);
  revalidatePath("/", "layout");
}

export async function listPromotionSlides(
  promotionId: string,
): Promise<PromotionSlideSummary[]> {
  await requireAdmin();
  const clean = promotionId?.trim();
  if (!clean) return [];
  const slides = await db.promotionSlide.findMany({
    where: { promotionId: clean },
    orderBy: { sortOrder: "asc" },
    include: { media: true },
  });
  return slides.map(toSummary);
}

async function nextSortOrder(promotionId: string): Promise<number> {
  const max = await db.promotionSlide.aggregate({
    where: { promotionId },
    _max: { sortOrder: true },
  });
  return (max._max.sortOrder ?? 0) + 1;
}

export interface PromotionSlideActionResult extends FormState {
  inactive?: boolean;
}

export async function addPromotionSlide(
  _prev: FormState,
  formData: FormData,
): Promise<PromotionSlideActionResult> {
  await requireAdmin();

  const promotionId = parseId(formData.get("promotionId"));
  if (!promotionId.ok) return { error: promotionId.error };
  const mediaId = parseId(formData.get("mediaId"));
  if (!mediaId.ok) return { error: mediaId.error };

  const [promotion, asset] = await Promise.all([
    db.promotion.findUnique({ where: { id: promotionId.value } }),
    db.mediaAsset.findUnique({ where: { id: mediaId.value } }),
  ]);
  if (!promotion) {
    return { error: "Cette promotion n'existe plus." };
  }
  if (!asset) {
    return { error: "Ce média n'existe plus." };
  }
  if (asset.type !== "image" && asset.type !== "video") {
    return { error: "Seules les images et les vidéos peuvent être utilisées." };
  }

  const duplicate = await db.promotionSlide.findUnique({
    where: {
      promotionId_mediaId: {
        promotionId: promotionId.value,
        mediaId: asset.id,
      },
    },
  });
  if (duplicate) {
    return { error: "Ce média est déjà dans cette promotion." };
  }

  try {
    const activeCount = await db.promotionSlide.count({
      where: { promotionId: promotionId.value, isActive: true },
    });
    const order = await nextSortOrder(promotionId.value);

    if (activeCount >= MAX_ACTIVE_PROMOTION_SLIDES) {
      await db.promotionSlide.create({
        data: {
          promotionId: promotionId.value,
          mediaId: asset.id,
          sortOrder: order,
          isActive: false,
        },
      });
      revalidatePromotion(promotionId.value);
      return { ok: true, inactive: true, error: PROMOTION_LIMIT_MESSAGE_FR };
    }

    await db.promotionSlide.create({
      data: {
        promotionId: promotionId.value,
        mediaId: asset.id,
        sortOrder: order,
        isActive: true,
      },
    });
    revalidatePromotion(promotionId.value);
    return { ok: true };
  } catch (error) {
    return { error: prismaError(error, "Impossible d'ajouter ce média à la promotion.") };
  }
}

export async function setPromotionSlideActive(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = parseId(formData.get("id"));
  if (!id.ok) return { error: id.error };
  const rawActive = formData.get("isActive");
  const wantActive = rawActive === "on" || rawActive === "true" || rawActive === "1";

  const slide = await db.promotionSlide.findUnique({ where: { id: id.value } });
  if (!slide) {
    return { error: "Ce média n'existe plus." };
  }
  if (slide.isActive === wantActive) {
    return { ok: true };
  }

  try {
    if (wantActive) {
      const activeCount = await db.promotionSlide.count({
        where: { promotionId: slide.promotionId, isActive: true },
      });
      if (activeCount >= MAX_ACTIVE_PROMOTION_SLIDES) {
        return { error: PROMOTION_LIMIT_MESSAGE_FR };
      }
    }
    await db.promotionSlide.update({
      where: { id: id.value },
      data: { isActive: wantActive },
    });
    revalidatePromotion(slide.promotionId);
    return { ok: true };
  } catch (error) {
    return { error: prismaError(error, "Impossible de modifier ce média.") };
  }
}

export async function movePromotionSlide(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = parseId(formData.get("id"));
  if (!id.ok) return { error: id.error };
  const direction = formData.get("direction");
  const dir = direction === "up" ? "up" : direction === "down" ? "down" : null;
  if (!dir) {
    return { error: "Direction invalide." };
  }

  const slide = await db.promotionSlide.findUnique({ where: { id: id.value } });
  if (!slide) {
    return { error: "Ce média n'existe plus." };
  }

  try {
    const siblings = await db.promotionSlide.findMany({
      where: { promotionId: slide.promotionId, isActive: slide.isActive },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    const index = siblings.findIndex((s) => s.id === slide.id);
    const neighbor = dir === "up" ? siblings[index - 1] : siblings[index + 1];
    if (!neighbor) {
      return { ok: true };
    }
    await db.$transaction([
      db.promotionSlide.update({
        where: { id: slide.id },
        data: { sortOrder: neighbor.sortOrder },
      }),
      db.promotionSlide.update({
        where: { id: neighbor.id },
        data: { sortOrder: slide.sortOrder },
      }),
    ]);
    revalidatePromotion(slide.promotionId);
    return { ok: true };
  } catch (error) {
    return { error: prismaError(error, "Impossible de réordonner les médias.") };
  }
}

export async function removePromotionSlide(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = parseId(formData.get("id"));
  if (!id.ok) return { error: id.error };

  try {
    const slide = await db.promotionSlide.findUnique({ where: { id: id.value } });
    if (!slide) {
      return { error: "Ce média n'existe plus." };
    }
    await db.promotionSlide.delete({ where: { id: id.value } });
    revalidatePromotion(slide.promotionId);
    return { ok: true };
  } catch (error) {
    return { error: prismaError(error, "Impossible de retirer ce média.") };
  }
}
