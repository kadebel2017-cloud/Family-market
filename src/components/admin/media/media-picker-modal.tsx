"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui";
import type {
  MediaAssetSummary,
  MediaCategory,
  MediaType,
} from "@/lib/media/types";
import {
  MEDIA_CATEGORY_LABELS,
  MEDIA_CATEGORY_OPTIONS,
  MEDIA_TYPE_LABELS,
} from "@/lib/media/types";
import { uploadMediaFiles } from "@/lib/media/upload-client";
import { MediaThumb, MediaTypeBadge } from "./media-thumb";

type AcceptType = MediaType | "all";

const IMAGE_ACCEPT =
  "image/jpeg,image/png,image/gif,image/webp,image/avif";
const VIDEO_ACCEPT = "video/mp4,video/webm,video/quicktime";

function acceptAttribute(accept: AcceptType): string {
  if (accept === "image") {
    return IMAGE_ACCEPT;
  }
  if (accept === "video") {
    return VIDEO_ACCEPT;
  }
  return `${IMAGE_ACCEPT},${VIDEO_ACCEPT}`;
}

export function MediaPickerModal({
  accept = "all",
  defaultCategory = "OTHER",
  onClose,
  onSelect,
}: {
  accept?: AcceptType;
  defaultCategory?: MediaCategory;
  onClose: () => void;
  onSelect: (asset: MediaAssetSummary) => void;
}) {
  const [media, setMedia] = useState<MediaAssetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<AcceptType>(accept);
  const [categoryFilter, setCategoryFilter] = useState<MediaCategory | "all">(
    "all",
  );
  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/media", { cache: "no-store" });
        if (cancelled) {
          return;
        }
        const body = (await res.json()) as {
          media?: MediaAssetSummary[];
          error?: string;
        };
        if (!res.ok) {
          throw new Error(body.error ?? "Impossible de charger les médias.");
        }
        setMedia(body.media ?? []);
        setError(null);
      } catch (err) {
        if (cancelled) {
          return;
        }
        setError(err instanceof Error ? err.message : "Erreur inconnue.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusables = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.tabIndex >= 0);

    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") {
        return;
      }
      const list = focusables();
      if (list.length === 0) {
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return media.filter((asset) => {
      if (typeFilter !== "all" && asset.type !== typeFilter) {
        return false;
      }
      if (categoryFilter !== "all" && asset.category !== categoryFilter) {
        return false;
      }
      if (q && !asset.name.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [media, query, typeFilter, categoryFilter]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        return;
      }

      setUploadError(null);
      setUploading(true);
      setUploadPercent(0);

      try {
        const assets = await uploadMediaFiles(
          [file],
          defaultCategory,
          setUploadPercent,
        );
        const asset = assets[0];
        if (!asset) {
          throw new Error("Échec de l'upload.");
        }
        setMedia((prev) => [asset, ...prev]);
        onSelect(asset);
        onClose();
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : "Une erreur est survenue.",
        );
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [defaultCategory, onSelect, onClose],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Choisir un média"
    >
      <div
        ref={dialogRef}
        className="flex max-h-[85vh] w-full max-w-3xl flex-col gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Choisir un média</h2>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Fermer
          </Button>
        </div>

        <div className="flex flex-col gap-2 rounded-md border border-gold-200 bg-gold-50 p-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4" aria-hidden />
              {uploading
                ? "Envoi en cours…"
                : "Télécharger depuis l'ordinateur"}
            </Button>
            <span className="text-xs text-muted-foreground">
              Catégorie : {MEDIA_CATEGORY_LABELS[defaultCategory]}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptAttribute(accept)}
              onChange={handleFileChange}
              tabIndex={-1}
              aria-hidden="true"
              className="sr-only"
            />
          </div>

          {uploading ? (
            <div className="space-y-1" role="status" aria-live="polite">
              <p className="text-xs text-muted-foreground">
                Envoi du fichier… {uploadPercent}%
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-black/5">
                <div
                  className="h-full rounded-full bg-gold-500 transition-all duration-200"
                  style={{ width: `${uploadPercent}%` }}
                />
              </div>
            </div>
          ) : null}

          {uploadError ? (
            <p className="text-sm text-red-600" role="alert">
              {uploadError}
            </p>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par nom…"
            className="h-10 w-full rounded-md border border-black/15 bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as AcceptType)}
            className="h-10 rounded-md border border-black/15 bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            aria-label="Filtrer par type"
          >
            <option value="all">Tous les types</option>
            {(["image", "video"] as const).map((t) => (
              <option key={t} value={t}>
                {MEDIA_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as MediaCategory | "all")
            }
            className="h-10 rounded-md border border-black/15 bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            aria-label="Filtrer par catégorie"
          >
            <option value="all">Toutes les catégories</option>
            {MEDIA_CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="min-h-[200px] flex-1 overflow-y-auto">
          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Chargement…
            </p>
          ) : error ? (
            <p className="py-10 text-center text-sm text-red-600">{error}</p>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {query || typeFilter !== "all" || categoryFilter !== "all"
                ? "Aucun média ne correspond à cette recherche."
                : "Aucun média disponible pour le moment."}
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {filtered.map((asset) => (
                <li key={asset.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(asset);
                      onClose();
                    }}
                    className="group flex w-full flex-col overflow-hidden rounded-md border border-black/10 bg-surface text-left hover:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                  >
                    <span className="relative aspect-square w-full overflow-hidden">
                      <MediaThumb media={asset} />
                      <span className="absolute right-1.5 top-1.5">
                        <MediaTypeBadge type={asset.type} />
                      </span>
                    </span>
                    <span className="truncate px-2 py-1.5 text-xs">
                      {asset.name}
                    </span>
                    <span className="truncate px-2 pb-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {MEDIA_CATEGORY_LABELS[asset.category]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}