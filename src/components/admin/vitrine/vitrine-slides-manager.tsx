"use client";

import { useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui";
import { MediaPickerModal } from "@/components/admin/media/media-picker-modal";
import { MediaThumb, MediaTypeBadge } from "@/components/admin/media/media-thumb";
import type { MediaAssetSummary } from "@/lib/media/types";
import {
  VITRINE_LIMIT_MESSAGE_AR,
  VITRINE_LIMIT_MESSAGE_FR,
  MAX_ACTIVE_VITRINE_SLIDES,
  type VitrineSlideSummary,
} from "@/lib/vitrine/constants";
import {
  addVitrineSlide,
  listVitrineSlides,
  moveVitrineSlide,
  removeVitrineSlide,
  setVitrineSlideActive,
} from "@/lib/actions/vitrine-slides";
import { cn } from "@/lib/utils";

function actionData(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    data.append(key, value);
  }
  return data;
}

function SlideRow({
  slide,
  position,
  isFirst,
  isLast,
  disabled,
  onChanged,
  onNotice,
}: {
  slide: VitrineSlideSummary;
  position: number;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  onChanged: (slides: VitrineSlideSummary[]) => void;
  onNotice: (message: string | null, arabic?: string | null) => void;
}) {
  const [, startTransition] = useTransition();

  const refresh = async () => {
    const slides = await listVitrineSlides();
    onChanged(slides);
  };

  const run = (
    action: (
      prev: { ok?: boolean; error?: string },
      formData: FormData,
    ) => Promise<{ ok?: boolean; error?: string }>,
    data: FormData,
  ) => {
    onNotice(null);
    startTransition(async () => {
      const result = await action({}, data);
      if (result.error && !result.ok) {
        onNotice(result.error);
      }
      await refresh();
    });
  };

  return (
    <li className="flex items-center gap-3 rounded-lg border border-black/10 bg-white p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
        {position}
      </span>
      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-black/5">
        <MediaThumb media={{ url: slide.url, type: slide.type, name: slide.name }} />
        <span className="absolute bottom-1 left-1">
          <MediaTypeBadge type={slide.type} />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium" title={slide.name}>
          {slide.name}
        </span>
        <span className="block text-xs text-muted-foreground">
          Photo
          {" · "}
          {slide.isActive ? "Active" : "Inactive"}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || isFirst}
          aria-label={`Monter la photo ${position}`}
          onClick={() => run(moveVitrineSlide, actionData({ id: slide.id, direction: "up" }))}
          className="h-9 w-9 px-0"
        >
          <ArrowUp className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || isLast}
          aria-label={`Descendre la photo ${position}`}
          onClick={() => run(moveVitrineSlide, actionData({ id: slide.id, direction: "down" }))}
          className="h-9 w-9 px-0"
        >
          <ArrowDown className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant={slide.isActive ? "outline" : "primary"}
          size="sm"
          disabled={disabled}
          onClick={() =>
            run(
              setVitrineSlideActive,
              actionData({ id: slide.id, isActive: slide.isActive ? "0" : "1" }),
            )
          }
        >
          {slide.isActive ? "Désactiver" : "Activer"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          aria-label={`Retirer ${slide.name} de la Vitrine`}
          title="Retirer de la Vitrine (le fichier reste dans la bibliothèque)"
          onClick={() => run(removeVitrineSlide, actionData({ id: slide.id }))}
          className="h-9 w-9 px-0 text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </Button>
      </span>
    </li>
  );
}

export function VitrineSlidesManager({
  initialSlides,
}: {
  initialSlides: VitrineSlideSummary[];
}) {
  const [slides, setSlides] = useState<VitrineSlideSummary[]>(initialSlides);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeAr, setNoticeAr] = useState<string | null>(null);

  const active = slides.filter((s) => s.isActive);
  const inactive = slides.filter((s) => !s.isActive);

  const showNotice = (message: string | null, arabic?: string | null) => {
    setNotice(message);
    setNoticeAr(arabic ?? null);
  };

  const handlePick = (asset: MediaAssetSummary) => {
    if (asset.type !== "image") {
      showNotice("Seules les photos peuvent être utilisées dans la Vitrine.");
      return;
    }
    showNotice(null);
    startTransition(async () => {
      const result = await addVitrineSlide({}, actionData({ mediaId: asset.id }));
      if (result.inactive) {
        // Created as inactive because the 10-active limit is reached.
        showNotice(VITRINE_LIMIT_MESSAGE_FR, VITRINE_LIMIT_MESSAGE_AR);
      } else if (result.error) {
        const isLimit = result.error === VITRINE_LIMIT_MESSAGE_FR;
        showNotice(result.error, isLimit ? VITRINE_LIMIT_MESSAGE_AR : null);
      }
      const updated = await listVitrineSlides();
      setSlides(updated);
    });
  };

  return (
    <section
      aria-labelledby="vitrine-media-title"
      className="rounded-lg border border-black/10 bg-surface p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="vitrine-media-title" className="text-base font-semibold">
            Vitrine — photos du magasin
          </h2>
          <p
            className={cn(
              "mt-0.5 text-sm font-medium",
              active.length >= MAX_ACTIVE_VITRINE_SLIDES
                ? "text-gold-600"
                : "text-muted-foreground",
            )}
            aria-live="polite"
          >
            Photos actives : {active.length} / {MAX_ACTIVE_VITRINE_SLIDES}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Devanture, entrée, intérieur, rayons — depuis la bibliothèque.
            Les fichiers restent dans la bibliothèque — retirer une photo ne
            supprime pas le fichier.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={() => setPickerOpen(true)}
        >
          <ImagePlus className="h-4 w-4" aria-hidden />
          Ajouter une photo
        </Button>
      </div>

      {notice ? (
        <p className="mt-3 rounded-md border border-gold-200 bg-gold-50 px-3 py-2 text-sm" role="alert">
          {notice}
          {noticeAr ? (
            <span className="mt-0.5 block" dir="rtl" lang="ar">
              {noticeAr}
            </span>
          ) : null}
        </p>
      ) : null}

      {active.length === 0 && inactive.length === 0 ? (
        <p className="mt-4 rounded-md border border-dashed border-black/15 px-4 py-6 text-center text-sm text-muted-foreground">
          Aucune photo Vitrine pour le moment. Ajoutez des photos du magasin
          depuis la bibliothèque.
        </p>
      ) : null}

      {active.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-sm font-semibold">Photos actives (ordre d&apos;affichage)</h3>
          <ul className="mt-2 flex flex-col gap-2">
            {active.map((slide, index) => (
              <SlideRow
                key={slide.id}
                slide={slide}
                position={index + 1}
                isFirst={index === 0}
                isLast={index === active.length - 1}
                disabled={pending}
                onChanged={setSlides}
                onNotice={showNotice}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {inactive.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-sm font-semibold">Inactives (conservées, réactivables)</h3>
          <ul className="mt-2 flex flex-col gap-2">
            {inactive.map((slide, index) => (
              <SlideRow
                key={slide.id}
                slide={slide}
                position={index + 1}
                isFirst={index === 0}
                isLast={index === inactive.length - 1}
                disabled={pending}
                onChanged={setSlides}
                onNotice={showNotice}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {pickerOpen ? (
        <MediaPickerModal
          accept="image"
          defaultCategory="VITRINE"
          onClose={() => setPickerOpen(false)}
          onSelect={handlePick}
        />
      ) : null}
    </section>
  );
}
