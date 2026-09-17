"use client";

import type { MediaAssetSummary, MediaCategory } from "./types";

interface UploadResponse {
  ok?: boolean;
  media?: MediaAssetSummary[];
  error?: string;
}

// Shared transport for the Phase 4 upload endpoint (/api/media/upload). Both
// the media library uploader and the picker modal go through here so there is
// a single client implementation of the upload flow.
export function uploadMediaFiles(
  files: File[],
  category: MediaCategory,
  onProgress?: (percent: number) => void,
): Promise<MediaAssetSummary[]> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.set("category", category);
    for (const file of files) {
      formData.append("files", file);
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/media/upload");
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0 && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      let body: UploadResponse;
      try {
        body = JSON.parse(xhr.responseText) as UploadResponse;
      } catch {
        reject(new Error("Réponse serveur invalide."));
        return;
      }
      if (xhr.status === 200 && body?.ok && body.media) {
        resolve(body.media);
        return;
      }
      reject(new Error(body?.error ?? "Échec de l'upload."));
    };
    xhr.onerror = () => reject(new Error("Impossible de contacter le serveur."));
    xhr.send(formData);
  });
}
