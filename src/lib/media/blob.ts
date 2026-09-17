import "server-only";

import { del, put, type PutBlobResult } from "@vercel/blob";

import { BLOB_BASE_FOLDER } from "./config";

export function hasBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function blobStorageMissingMessage(): string {
  return "Le stockage des fichiers n'est pas configuré.";
}

export interface BlobUploadInput {
  blobName: string;
  extension: string;
  mimeType: string;
  body: File;
}

export async function uploadFileToBlob(
  input: BlobUploadInput,
): Promise<PutBlobResult> {
  const pathname = `${BLOB_BASE_FOLDER}/${input.blobName}${input.extension}`;
  return put(pathname, input.body, {
    access: "public",
    contentType: input.mimeType,
    addRandomSuffix: true,
    allowOverwrite: false,
  });
}

// Vercel Blob URLs always live on a *.public.blob.vercel-storage.com host.
// Blobs uploaded before this phase may live elsewhere — those simply have no
// stored object to delete.
export function isBlobUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export async function deleteBlobUrl(url: string): Promise<void> {
  await del(url);
}