"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
} from "react";

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
  formatMediaSize,
} from "@/lib/media/types";
import { deleteMediaAsset } from "@/lib/actions/media";
import { EmptyState } from "@/components/admin/empty-state";
import { MediaUploader } from "./media-uploader";
import { MediaThumb, MediaTypeBadge } from "./media-thumb";

type FilterType = MediaType | "all";

function MediaDeleteButton({
  asset,
  onDeleted,
}: {
  asset: MediaAssetSummary;
  onDeleted: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(
    deleteMediaAsset,
    {},
  );

  useEffect(() => {
    if (state.ok && !state.error) {
      onDeleted();
    }
  }, [state, onDeleted]);

  if (confirming) {
    return (
      <form action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="id" value={asset.id} />
        <Button type="submit" variant="danger" size="sm" disabled={pending}>
          {pending ? "Suppression…" : "Supprimer"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => setConfirming(false)}
        >
          Annuler
        </Button>
        {state.error ? (
          <span className="text-xs text-red-600">{state.error}</span>
        ) : null}
      </form>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setConfirming(true)}
      >
        Supprimer
      </Button>
      {state.error ? (
        <span className="text-xs text-red-600">{state.error}</span>
      ) : null}
    </>
  );
}

export function MediaGallery({
  initialMedia,
}: {
  initialMedia: MediaAssetSummary[];
}) {
  const [media, setMedia] = useState<MediaAssetSummary[]>(initialMedia);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [categoryFilter, setCategoryFilter] = useState<MediaCategory | "all">(
    "all",
  );

  const handleUploaded = (assets: MediaAssetSummary[]) => {
    setMedia((prev) => [...assets, ...prev]);
  };

  const handleDeleted = (id: string) => {
    setMedia((prev) => prev.filter((asset) => asset.id !== id));
  };

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

  const hasFilters =
    query.trim() !== "" || typeFilter !== "all" || categoryFilter !== "all";

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8">
      <MediaUploader onUploaded={handleUploaded} />

      {media.length === 0 ? (
        <EmptyState
          title="Aucun média"
          description="Envoyez une première image ou vidéo avec le formulaire ci-dessus."
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par nom…"
              className="h-10 w-full rounded-md border border-black/15 bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              aria-label="Rechercher un média"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as FilterType)}
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

          {filtered.length === 0 ? (
            <EmptyState
              title="Aucun résultat"
              description={
                hasFilters
                  ? "Aucun média ne correspond à cette recherche."
                  : "Aucun média disponible."
              }
            />
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {filtered.length} média{filtered.length > 1 ? "s" : ""}
              </p>
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {filtered.map((asset) => (
                  <li
                    key={asset.id}
                    className="flex flex-col overflow-hidden rounded-lg border border-black/10 bg-surface"
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-black/5">
                      <MediaThumb media={asset} />
                      <span className="absolute right-1.5 top-1.5">
                        <MediaTypeBadge type={asset.type} />
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-3">
                      <p
                        className="truncate text-sm font-medium"
                        title={asset.name}
                      >
                        {asset.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {MEDIA_CATEGORY_LABELS[asset.category]} ·{" "}
                        {formatMediaSize(asset.size)}
                      </p>
                      <div className="mt-2 flex justify-end">
                        <MediaDeleteButton
                          asset={asset}
                          onDeleted={() => handleDeleted(asset.id)}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}