"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/dal";
import {
  HERO_LIMIT_MESSAGE_FR,
  MAX_ACTIVE_HERO_SLIDES,
  type HeroSlideSummary,
} from "@/lib/hero/constants";
import { parseId, prismaError } from "./helpers";
import type { FormState } from "./types";

const ADMIN_SETTINGS_PATH = "/admin/settings";

export interface HeroActionResult extends FormState {
  inactive?: boolean;
}

function toSummary(slide: {
  id: string;
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
}): HeroSlideSummary {
  return {
    id: slide.id,
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

function revalidateHero(): void {
  revalidatePath(ADMIN_SETTINGS_PATH);
  revalidatePath("/", "layout");
}

export async function listHeroSlides(): Promise<HeroSlideSummary[]> {
  await requireAdmin();
  const slides = await db.heroSlide.findMany({
    orderBy: { sortOrder: "asc" },
    include: { media: true },
  });
  return slides.map(toSummary);
}

async function nextSortOrder(): Promise<number> {
  const max = await db.heroSlide.aggregate({ _max: { sortOrder: true } });
  return (max._max.sortOrder ?? 0) + 1;
}

export async function addHeroSlide(
  _prev: FormState,
  formData: FormData,
): Promise<HeroActionResult> {
  await requireAdmin();

  const mediaId = parseId(formData.get("mediaId"));
  if (!mediaId.ok) return { error: mediaId.error };

  const asset = await db.mediaAsset.findUnique({
    where: { id: mediaId.value },
  });
  if (!asset) {
    return { error: "Ce média n'existe plus." };
  }
  if (asset.type !== "image" && asset.type !== "video") {
    return { error: "Seules les images et les vidéos peuvent être utilisées dans le Hero." };
  }

  const duplicate = await db.heroSlide.findUnique({
    where: { mediaId: asset.id },
  });
  if (duplicate) {
    return { error: "Ce média est déjà dans le Hero." };
  }

  try {
    const activeCount = await db.heroSlide.count({
      where: { isActive: true },
    });
    const order = await nextSortOrder();

    if (activeCount >= MAX_ACTIVE_HERO_SLIDES) {
      await db.heroSlide.create({
        data: { mediaId: asset.id, sortOrder: order, isActive: false },
      });
      revalidateHero();
      return { ok: true, inactive: true, error: HERO_LIMIT_MESSAGE_FR };
    }

    await db.heroSlide.create({
      data: { mediaId: asset.id, sortOrder: order, isActive: true },
    });
    revalidateHero();
    return { ok: true };
  } catch (error) {
    return { error: prismaError(error, "Impossible d'ajouter ce média au Hero.") };
  }
}

export async function setHeroSlideActive(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = parseId(formData.get("id"));
  if (!id.ok) return { error: id.error };
  const rawActive = formData.get("isActive");
  const wantActive = rawActive === "on" || rawActive === "true" || rawActive === "1";

  const slide = await db.heroSlide.findUnique({ where: { id: id.value } });
  if (!slide) {
    return { error: "Cette diapositive n'existe plus." };
  }
  if (slide.isActive === wantActive) {
    return { ok: true };
  }

  try {
    if (wantActive) {
      const activeCount = await db.heroSlide.count({
        where: { isActive: true },
      });
      if (activeCount >= MAX_ACTIVE_HERO_SLIDES) {
        return { error: HERO_LIMIT_MESSAGE_FR };
      }
    }
    await db.heroSlide.update({
      where: { id: id.value },
      data: { isActive: wantActive },
    });
    revalidateHero();
    return { ok: true };
  } catch (error) {
    return { error: prismaError(error, "Impossible de modifier cette diapositive.") };
  }
}

export async function moveHeroSlide(
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

  const slide = await db.heroSlide.findUnique({ where: { id: id.value } });
  if (!slide) {
    return { error: "Cette diapositive n'existe plus." };
  }

  try {
    const siblings = await db.heroSlide.findMany({
      where: { isActive: slide.isActive },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    const index = siblings.findIndex((s) => s.id === slide.id);
    const neighbor = dir === "up" ? siblings[index - 1] : siblings[index + 1];
    if (!neighbor) {
      return { ok: true };
    }
    await db.$transaction([
      db.heroSlide.update({
        where: { id: slide.id },
        data: { sortOrder: neighbor.sortOrder },
      }),
      db.heroSlide.update({
        where: { id: neighbor.id },
        data: { sortOrder: slide.sortOrder },
      }),
    ]);
    revalidateHero();
    return { ok: true };
  } catch (error) {
    return { error: prismaError(error, "Impossible de réordonner les diapositives.") };
  }
}

export async function removeHeroSlide(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = parseId(formData.get("id"));
  if (!id.ok) return { error: id.error };

  try {
    // Deletes only the HeroSlide usage — the MediaAsset file stays
    // in /admin/media and can be reused later.
    await db.heroSlide.delete({ where: { id: id.value } });
    revalidateHero();
    return { ok: true };
  } catch (error) {
    return { error: prismaError(error, "Impossible de retirer cette diapositive.") };
  }
}
