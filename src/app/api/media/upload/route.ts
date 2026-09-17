import { del } from "@vercel/blob";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { verifySessionToken, getSessionToken } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  blobStorageMissingMessage,
  hasBlobStorage,
  uploadFileToBlob,
} from "@/lib/media/blob";
import { MEDIA_CATEGORIES } from "@/lib/media/config";
import type { MediaCategory } from "@/lib/media/types";
import { validateMediaFile, type ValidatedMediaFile } from "@/lib/media/validate";

export const maxDuration = 60;

function unauthorized() {
  return NextResponse.json(
    { error: "Authentification requise." },
    { status: 401 },
  );
}

export async function POST(request: NextRequest) {
  const token = await getSessionToken();
  if (!token) {
    return unauthorized();
  }
  const session = await verifySessionToken(token);
  if (!session) {
    return unauthorized();
  }

  if (!hasBlobStorage()) {
    return NextResponse.json(
      { error: blobStorageMissingMessage() },
      { status: 503 },
    );
  }

  const formData = await request.formData();
  const rawCategory =
    typeof formData.get("category") === "string"
      ? String(formData.get("category"))
      : "";
  const category: MediaCategory = (MEDIA_CATEGORIES as readonly string[]).includes(
    rawCategory,
  )
    ? (rawCategory as MediaCategory)
    : "OTHER";

  const files = formData.getAll("files").filter(
    (entry): entry is File => entry instanceof File,
  );
  if (files.length === 0) {
    return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  }

  const validated: ValidatedMediaFile[] = [];
  for (const file of files) {
    const result = await validateMediaFile(file);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    validated.push(result.value);
  }

  const uploaded: { url: string; file: ValidatedMediaFile }[] = [];

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const info = validated[i];
      const blob = await uploadFileToBlob({
        blobName: info.blobName,
        extension: info.extension,
        mimeType: info.mimeType,
        body: file,
      });
      uploaded.push({ url: blob.url, file: info });
    }

    const assets = await Promise.all(
      uploaded.map(async ({ url, file }) =>
        db.mediaAsset.create({
          data: {
            name: file.name,
            url,
            type: file.type,
            mimeType: file.mimeType,
            size: file.size,
            category,
          },
        }),
      ),
    );

    revalidatePath("/admin/media");
    return NextResponse.json({ ok: true, media: assets });
  } catch (error) {
    // The store may already hold blobs whose DB rows failed to persist:
    // clean them up so the library stays consistent with the metadata.
    await Promise.allSettled(
      uploaded.map(async ({ url }) => {
        try {
          await del(url);
        } catch {
          /* best effort */
        }
      }),
    );
    console.error("[api] échec de l'upload média", error);
    return NextResponse.json(
      { error: "Une erreur est survenue pendant l'enregistrement des fichiers." },
      { status: 500 },
    );
  }
}