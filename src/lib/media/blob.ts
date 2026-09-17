import "server-only";

import { del, put, type PutBlobResult } from "@vercel/blob";

import { BLOB_BASE_FOLDER } from "./config";

// Vercel Blob resolves credentials itself (see resolveBlobAuth in
// @vercel/blob): an explicit token, else Vercel OIDC (VERCEL_OIDC_TOKEN /
// request header) together with a store id, else the static
// BLOB_READ_WRITE_TOKEN. This guard just avoids calling the SDK when no
// credential source exists at all, so it must accept both the legacy token
// and the modern OIDC store connection.
export function hasBlobStorage(): boolean {
  // Legacy long-lived read-write token (local dev, or deployments that use it).
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return true;
  }
  // Vercel Blob OIDC: a store connected to the project injects BLOB_STORE_ID
  // and the SDK obtains a short-lived token automatically.
  return Boolean(process.env.BLOB_STORE_ID);
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