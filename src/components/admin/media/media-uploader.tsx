"use client";

import { useRef, useState, useCallback } from "react";

import { Button } from "@/components/ui";
import type { MediaAssetSummary, MediaCategory } from "@/lib/media/types";
import { MEDIA_CATEGORY_OPTIONS } from "@/lib/media/types";
import { uploadMediaFiles } from "@/lib/media/upload-client";

type UploadStatus =
  | { phase: "idle" }
  | { phase: "uploading"; percent: number; filename: string }
  | { phase: "success"; count: number }
  | { phase: "error"; message: string };

export function MediaUploader({
  onUploaded,
  defaultCategory = "OTHER",
}: {
  onUploaded: (assets: MediaAssetSummary[]) => void;
  defaultCategory?: MediaCategory;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>({ phase: "idle" });
  const [category, setCategory] = useState<MediaCategory>(defaultCategory);
  const [files, setFiles] = useState<File[]>([]);

  const reset = useCallback(() => {
    setStatus({ phase: "idle" });
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFiles(Array.from(e.target.files ?? []));
    },
    [],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const dropped = Array.from(e.dataTransfer.files ?? []);
      if (dropped.length > 0) {
        setFiles(dropped);
      }
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (files.length === 0) {
        return;
      }

      const firstFile = files[0];
      const label =
        files.length === 1 ? firstFile.name : `${files.length} fichiers…`;
      setStatus({ phase: "uploading", percent: 0, filename: label });

      try {
        const assets = await uploadMediaFiles(files, category, (pct) =>
          setStatus({ phase: "uploading", percent: pct, filename: label }),
        );

        setStatus({ phase: "success", count: assets.length });
        onUploaded(assets);
        // Clear only the temporary file selection so the next upload starts
        // empty. Uploaded files stay in the library; the success message
        // and category choice are preserved.
        setFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        setStatus({
          phase: "error",
          message:
            error instanceof Error ? error.message : "Une erreur est survenue.",
        });
      }
    },
    [files, category, onUploaded],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-black/10 p-5"
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDrop={handleDrop}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="media-category"
            className="block text-sm font-medium text-foreground"
          >
            Catégorie
          </label>
          <select
            id="media-category"
            className="flex h-11 w-full rounded-md border border-black/15 bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            value={category}
            onChange={(e) => setCategory(e.target.value as MediaCategory)}
          >
            {MEDIA_CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="media-file-input"
            className="block text-sm font-medium text-foreground"
          >
            Fichiers
          </label>
          <input
            ref={fileInputRef}
            id="media-file-input"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/gif,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
            onChange={handleFileChange}
            className="h-11 w-full rounded-md border border-black/15 bg-surface px-3 py-2 text-sm text-foreground file:mr-3 file:rounded file:border-0 file:bg-gold-500 file:px-3 file:py-1 file:text-sm file:font-medium file:text-white hover:file:bg-gold-600"
          />
        </div>
      </div>

      {files.length > 0 && status.phase === "idle" && (
        <ul className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {files.map((f) => (
            <li
              key={`${f.name}-${f.size}`}
              className="rounded-full bg-black/5 px-2 py-0.5"
            >
              {f.name} ({(f.size / 1024 / 1024).toFixed(1)} Mo)
            </li>
          ))}
        </ul>
      )}

      {status.phase === "uploading" && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Envoi de {status.filename}…
            </span>
            <span>{status.percent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-black/5">
            <div
              className="h-full rounded-full bg-gold-500 transition-all duration-200"
              style={{ width: `${status.percent}%` }}
            />
          </div>
        </div>
      )}

      {status.phase === "success" && (
        <p className="text-sm text-emerald-700">
          {status.count} fichier{status.count > 1 ? "s" : ""} envoyé
          {status.count > 1 ? "s" : ""} avec succès.
        </p>
      )}

      {status.phase === "error" && (
        <p className="text-sm text-red-600">{status.message}</p>
      )}

      <div className="flex justify-end gap-3">
        {(status.phase === "success" || status.phase === "error") && (
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            Réinitialiser
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={
            files.length === 0 ||
            status.phase === "uploading" ||
            status.phase === "success"
          }
        >
          {status.phase === "uploading"
            ? "Envoi…"
            : `Envoyer${files.length > 0 ? ` (${files.length})` : ""}`}
        </Button>
      </div>
    </form>
  );
}