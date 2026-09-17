"use client";

import { useState } from "react";

import { Button } from "@/components/ui";
import type {
  MediaAssetSummary,
  MediaCategory,
  MediaType,
} from "@/lib/media/types";
import { MediaPickerModal } from "./media-picker-modal";
import { MediaThumb, MediaTypeBadge } from "./media-thumb";

export function MediaField({
  name,
  label,
  defaultValue = "",
  accept = "image",
  category = "OTHER",
  hint,
  required = false,
  chooseLabel = "Choisir un média",
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  accept?: MediaType | "all";
  category?: MediaCategory;
  hint?: string;
  required?: boolean;
  chooseLabel?: string;
}) {
  const [value, setValue] = useState<string>(defaultValue ?? "");
  const [picked, setPicked] = useState<MediaAssetSummary | null>(null);
  const [open, setOpen] = useState(false);

  const handleSelect = (asset: MediaAssetSummary) => {
    setValue(asset.url);
    setPicked(asset);
  };

  const handleClear = () => {
    setValue("");
    setPicked(null);
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">{label}</label>

      <input type="hidden" name={name} value={value} required={required ? true : undefined} />

      {value ? (
        <div className="flex items-center gap-4 rounded-md border border-gold-200 bg-surface p-3">
          <div className="relative aspect-square h-20 w-20 shrink-0 overflow-hidden rounded-md ring-2 ring-gold-500/60">
            <MediaThumb
              media={picked ?? { url: value, type: accept === "video" ? "video" : "image", name: "Aperçu" }}
            />
            {picked ? (
              <span className="absolute right-1 top-1">
                <MediaTypeBadge type={picked.type} />
              </span>
            ) : null}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="truncate text-sm text-muted-foreground" title={value}>
              {value}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
                Changer
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
                Retirer
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-black/15 bg-surface px-4 py-5 text-center">
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
            {chooseLabel}
          </Button>
        </div>
      )}

      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}

      {open ? (
        <MediaPickerModal
          accept={accept}
          defaultCategory={category}
          onClose={() => setOpen(false)}
          onSelect={handleSelect}
        />
      ) : null}
    </div>
  );
}