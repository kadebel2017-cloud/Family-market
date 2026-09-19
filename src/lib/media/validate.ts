import "server-only";

import { slugify } from "@/lib/admin/format";
import { MAX_IMAGE_SIZE_BYTES, MAX_VIDEO_SIZE_BYTES } from "./config";
import type { MediaType } from "./types";

export interface ValidatedMediaFile {
  name: string;
  blobName: string;
  type: MediaType;
  mimeType: string;
  extension: string;
  size: number;
}

const MIME_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

// Canonical extension for each detectable format: when the filename lies
// (e.g. a Facebook download serving WEBP content named ".png"), the file is
// saved with the extension matching its REAL content.
const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
]);

// Detect the real MIME type from the file's magic bytes (never trust the
// client-provided Content-Type). Returns null when the content is unknown,
// matches an unlisted format, or is not a supported image/video.
export function sniffMimeType(bytes: Uint8Array): string | null {
  if (bytes.length < 12) {
    return null;
  }

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return "image/gif";
  }

  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return "video/webm";
  }

  // ISO Base Media File Format: MP4 / MOV / AVIF / HEIC share a "ftyp" box.
  const isIsoBmff =
    bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70;
  if (isIsoBmff) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (brand === "avif" || brand === "avis") {
      return "image/avif";
    }
    if (brand === "qt  ") {
      return "video/quicktime";
    }
    if (
      brand === "isom" ||
      brand === "iso2" ||
      brand === "mp41" ||
      brand === "mp42" ||
      brand === "avc1" ||
      brand === "M4V "
    ) {
      return "video/mp4";
    }
  }

  return null;
}

function resolveExtension(filenameExtension: string, mimeType: string): string {
  // The filename extension is only kept when it agrees with the sniffed
  // content (preserves ".jpeg" vs ".jpg" and ".mov" choices). Otherwise the
  // real format wins — a WEBP file named ".png" is saved as ".webp".
  if (MIME_BY_EXTENSION[filenameExtension.toLowerCase()] === mimeType) {
    return filenameExtension.toLowerCase();
  }
  return EXTENSION_BY_MIME[mimeType] ?? filenameExtension.toLowerCase();
}

function sanitizeBaseName(filename: string): string {
  const withoutExt = filename.replace(/\.[a-zA-Z0-9]+$/, "");
  const slug = slugify(withoutExt);
  return slug || "media";
}

export async function validateMediaFile(
  file: File,
): Promise<{ ok: true; value: ValidatedMediaFile } | { ok: false; error: string }> {
  const originalName = file.name || "fichier";
  const lower = originalName.toLowerCase();
  const parts = lower.split(".");
  const filenameExtension = parts.length > 1 ? "." + (parts.pop() ?? "") : "";

  if (file.size <= 0) {
    return { ok: false, error: `« ${originalName} » est vide.` };
  }

  // The REAL format comes from the magic bytes, never from the filename or
  // the client-provided Content-Type. Unknown content is rejected here, so
  // fake / non-image files can never pass validation.
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const mimeType = sniffMimeType(head);
  if (!mimeType) {
    return {
      ok: false,
      error: `« ${originalName} » n'est pas un fichier image ou vidéo valide.`,
    };
  }

  const type: MediaType = IMAGE_MIME_TYPES.has(mimeType) ? "image" : "video";
  const max = type === "image" ? MAX_IMAGE_SIZE_BYTES : MAX_VIDEO_SIZE_BYTES;
  if (file.size > max) {
    const limitMo = Math.round((max / (1024 * 1024)) * 10) / 10;
    return {
      ok: false,
      error: `« ${originalName} » dépasse la limite de ${limitMo} Mo pour les ${type === "image" ? "images" : "vidéos"}.`,
    };
  }

  const extension = resolveExtension(filenameExtension, mimeType);

  return {
    ok: true,
    value: {
      name: originalName,
      blobName: sanitizeBaseName(originalName),
      type,
      mimeType,
      extension,
      size: file.size,
    },
  };
}