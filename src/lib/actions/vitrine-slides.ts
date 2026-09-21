"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/dal";
import {
  VITRINE_LIMIT_MESSAGE_FR,
  MAX_ACTIVE_VITRINE_SLIDES,
  type VitrineSlideSummary,
} from "@/lib/vitrine/constants";
import { parseId, prismaError } from "./helpers";
import type { FormState } from "./types";

const ADMIN_SETTINGS_PATH = "/admin/settings";
const PUBLIC_ABOUT_PATH = "/about";

export interface VitrineActionResult extends FormState {
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
}): VitrineSlideSummary {
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

function revalidateVitrine(): void {
  revalidatePath(ADMIN_SETTINGS_PATH);
  revalidatePath(PUBLIC_ABOUT_PATH);
  revalidatePath("/", "layout");
}

export async function listVitrineSlides(): Promise<VitrineSlideSummary[]> {
  await requireAdmin();
  const slides = await db.vitrineSlide.findMany({
    orderBy: { sortOrder: "asc" },
    include: { media: true },
  });
  return slides.map(toSummary);
}

async function nextSortOrder(): Promise<number> {
  const max = await db.vitrineSlide.aggregate({ _max: { sortOrder: true } });
  return (max._max.sortOrder ?? 0) + 1;
}

export async function addVitrineSlide(
  _prev: FormState,
  formData: FormData,
): Promise<VitrineActionResult> {
  await requireAdmin();

  const mediaId = parseId(formData.get("mediaId"));
  if (!mediaId.ok) return { error: mediaId.error };

  const asset = await db.mediaAsset.findUnique({
    where: { id: mediaId.value },
  });
  if (!asset) {
    return { error: "Ce média n'existe plus." };
  }
  if (asset.type !== "image") {
    return { error: "Seules les photos peuvent être utilisées dans la Vitrine." };
  }

  const duplicate = await db.vitrineSlide.findUnique({
    where: { mediaId: asset.id },
  });
  if (duplicate) {
    return { error: "Ce média est déjà dans la Vitrine." };
  }

  try {
    const activeCount = await db.vitrineSlide.count({
      where: { isActive: true },
    });
    const order = await nextSortOrder();

    if (activeCount >= MAX_ACTIVE_VITRINE_SLIDES) {
      await db.$transaction([
        db.mediaAsset.update({
          where: { id: asset.id },
          data: { category: "VITRINE" },
        }),
        db.vitrineSlide.create({
          data: { mediaId: asset.id, sortOrder: order, isActive: false },
        }),
      ]);
      revalidateVitrine();
      return { ok: true, inactive: true, error: VITRINE_LIMIT_MESSAGE_FR };
    }

    await db.$transaction([
      db.mediaAsset.update({
        where: { id: asset.id },
        data: { category: "VITRINE" },
      }),
      db.vitrineSlide.create({
        data: { mediaId: asset.id, sortOrder: order, isActive: true },
      }),
    ]);
    revalidateVitrine();
    return { ok: true };
  } catch (error) {
    return { error: prismaError(error, "Impossible d'ajouter ce média à la Vitrine.") };
  }
}

export async function setVitrineSlideActive(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = parseId(formData.get("id"));
  if (!id.ok) return { error: id.error };
  const rawActive = formData.get("isActive");
  const wantActive = rawActive === "on" || rawActive === "true" || rawActive === "1";

  const slide = await db.vitrineSlide.findUnique({ where: { id: id.value } });
  if (!slide) {
    return { error: "Cette photo n'existe plus." };
  }
  if (slide.isActive === wantActive) {
    return { ok: true };
  }

  try {
    if (wantActive) {
      const activeCount = await db.vitrineSlide.count({
        where: { isActive: true },
      });
      if (activeCount >= MAX_ACTIVE_VITRINE_SLIDES) {
        return { error: VITRINE_LIMIT_MESSAGE_FR };
      }
    }
    await db.vitrineSlide.update({
      where: { id: id.value },
      data: { isActive: wantActive },
    });
    revalidateVitrine();
    return { ok: true };
  } catch (error) {
    return { error: prismaError(error, "Impossible de modifier cette photo.") };
  }
}

export async function moveVitrineSlide(
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

  const slide = await db.vitrineSlide.findUnique({ where: { id: id.value } });
  if (!slide) {
    return { error: "Cette photo n'existe plus." };
  }

  try {
    const siblings = await db.vitrineSlide.findMany({
      where: { isActive: slide.isActive },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    const index = siblings.findIndex((s) => s.id === slide.id);
    const neighbor = dir === "up" ? siblings[index - 1] : siblings[index + 1];
    if (!neighbor) {
      return { ok: true };
    }
    await db.$transaction([
      db.vitrineSlide.update({
        where: { id: slide.id },
        data: { sortOrder: neighbor.sortOrder },
      }),
      db.vitrineSlide.update({
        where: { id: neighbor.id },
        data: { sortOrder: slide.sortOrder },
      }),
    ]);
    revalidateVitrine();
    return { ok: true };
  } catch (error) {
    return { error: prismaError(error, "Impossible de réordonner les photos.") };
  }
}

export async function removeVitrineSlide(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = parseId(formData.get("id"));
  if (!id.ok) return { error: id.error };

  try {
    // Deletes only the VitrineSlide usage — the MediaAsset file stays
    // in /admin/media and can be reused later.
    await db.vitrineSlide.delete({ where: { id: id.value } });
    revalidateVitrine();
    return { ok: true };
  } catch (error) {
    return { error: prismaError(error, "Impossible de retirer cette photo.") };
  }
}
