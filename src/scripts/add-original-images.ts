import "dotenv/config";

import { writeFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { put } from "@vercel/blob";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * IMAGE-ONLY update for original (pre-import) Family Market products.
 * - Touches ONLY Product.image (+ automatic updatedAt).
 * - Creates one MediaAsset per image (category PRODUCT).
 * - Never creates/deletes products, never touches any other field.
 */

type Match = { slug: string; sourceId: number; imageUrl: string };

const MATCHES: Match[] = [
  { slug: "concentre-tomate-800g", sourceId: 39441, imageUrl: "https://familymarket13.com/wp-content/uploads/2025/12/1000216281-1.jpg" },
  { slug: "cookies-200g", sourceId: 38586, imageUrl: "https://familymarket13.com/wp-content/uploads/2025/10/6050837613117115281_121.webp" },
  { slug: "dentifrice-75ml", sourceId: 34412, imageUrl: "https://familymarket13.com/wp-content/uploads/2025/06/Untitled-design-61-1.webp" },
  { slug: "desodorisant-maison-300ml", sourceId: 30718, imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_7065.jpg" },
  { slug: "essuie-tout-2-rouleaux", sourceId: 28934, imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_6448.png" },
  { slug: "farine-1kg", sourceId: 34668, imageUrl: "https://familymarket13.com/wp-content/uploads/2025/07/Farine_T55_FR-1-400x400-1.webp" },
  { slug: "flocons-avoine-500g", sourceId: 34277, imageUrl: "https://familymarket13.com/wp-content/uploads/2025/06/Untitled-design-5.webp" },
  { slug: "frites-surgeles-1kg", sourceId: 37132, imageUrl: "https://familymarket13.com/wp-content/uploads/2025/09/Design-sans-titre-2025-09-04T092316.939.webp" },
  { slug: "harissa-135g", sourceId: 39835, imageUrl: "https://familymarket13.com/wp-content/uploads/2026/02/1000239485.jpg" },
  { slug: "lait-uht-1l", sourceId: 34208, imageUrl: "https://familymarket13.com/wp-content/uploads/2025/06/Untitled-design-12.png" },
  { slug: "lben-1l", sourceId: 41539, imageUrl: "https://familymarket13.com/wp-content/uploads/2026/07/1000011173.jpg" },
  { slug: "margarine-250g", sourceId: 37111, imageUrl: "https://familymarket13.com/wp-content/uploads/2025/09/Design-sans-titre-2025-09-04T091144.208.webp" },
  { slug: "miel-250g", sourceId: 38555, imageUrl: "https://familymarket13.com/wp-content/uploads/2025/10/6050837613117115296_121.webp" },
  { slug: "nettoyant-multi-surfaces-750ml", sourceId: 29462, imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_5805.png" },
  { slug: "pates-500g", sourceId: 42408, imageUrl: "https://familymarket13.com/wp-content/uploads/2026/09/1000014311.jpg" },
  { slug: "petits-pois-1kg", sourceId: 37136, imageUrl: "https://familymarket13.com/wp-content/uploads/2025/09/Design-sans-titre-2025-09-04T092419.388.webp" },
  { slug: "riz-1kg", sourceId: 29790, imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_6656.jpg" },
  { slug: "shampooing-250ml", sourceId: 30952, imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_7111.jpg" },
  { slug: "sucre-blanc-1kg", sourceId: 35431, imageUrl: "https://familymarket13.com/wp-content/uploads/2025/08/Design-sans-titre-2025-08-02T215020.645.webp" },
  { slug: "thon-en-conserve-160g", sourceId: 29143, imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_7468.png" },
];

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/avif": ".avif",
};
const MAX_BYTES = 10 * 1024 * 1024;

function sniffMime(bytes: Buffer): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes.length >= 6 && bytes.toString("ascii", 0, 6) === "GIF89a") return "image/gif";
  if (bytes.length >= 6 && bytes.toString("ascii", 0, 6) === "GIF87a") return "image/gif";
  if (bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (bytes.length >= 12 && bytes.toString("ascii", 4, 8) === "ftyp") {
    const brand = bytes.toString("ascii", 8, 12);
    if (brand === "avif" || brand === "avis") return "image/avif";
  }
  return null;
}

async function download(url: string): Promise<Buffer> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (FamilyMarket image-only import)" },
        signal: AbortSignal.timeout(60_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      if (!buffer.length) throw new Error("empty body");
      if (buffer.length > MAX_BYTES) throw new Error(`too large (${buffer.length} bytes)`);
      return buffer;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    }
  }
  throw lastError;
}

type Snapshot = Record<string, unknown>;

function snapshotOf(p: Record<string, unknown>): Snapshot {
  const { image: _image, updatedAt: _updatedAt, category: _category, ...rest } = p;
  void _image;
  void _updatedAt;
  void _category;
  return rest;
}

function snapshotsEqual(a: Snapshot, b: Snapshot): string[] {
  const diffs: string[] = [];
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) diffs.push(key);
  }
  return diffs;
}

async function main(): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("Stockage Blob non configuré (BLOB_READ_WRITE_TOKEN manquant).");
    process.exit(1);
  }
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const updated: { slug: string; nameFr: string; file: string; url: string }[] = [];
  const skipped: string[] = [];

  for (const match of MATCHES) {
    const product = await prisma.product.findUnique({
      where: { slug: match.slug },
      include: { category: { select: { slug: true } } },
    });
    if (!product) {
      skipped.push(`${match.slug} (introuvable)`);
      continue;
    }
    if (product.category.slug === "boissons") {
      skipped.push(`${match.slug} (Boissons — ne pas toucher)`);
      continue;
    }
    if (product.image && product.image.includes("blob.vercel-storage.com")) {
      skipped.push(`${match.slug} (image déjà présente)`);
      continue;
    }
    const before = snapshotOf(product as unknown as Record<string, unknown>);

    try {
      const bytes = await download(match.imageUrl);
      const mimeType = sniffMime(bytes);
      if (!mimeType || !ALLOWED_MIME_TO_EXT[mimeType]) {
        skipped.push(`${match.slug} (type MIME non supporté)`);
        continue;
      }
      const mediaName = `family-market-${match.slug}`;
      const fileName = `${mediaName}${ALLOWED_MIME_TO_EXT[mimeType]}`;
      const body = new Uint8Array(bytes.length);
      body.set(bytes);

      const existingMedia = await prisma.mediaAsset.findFirst({ where: { name: mediaName } });
      let url: string;
      if (existingMedia) {
        url = existingMedia.url;
      } else {
        const blob = await put(`media/${fileName}`, new File([body], fileName, { type: mimeType }), {
          access: "public",
          addRandomSuffix: true,
          contentType: mimeType,
        });
        await prisma.mediaAsset.create({
          data: {
            name: mediaName,
            url: blob.url,
            type: "image",
            mimeType,
            size: bytes.length,
            category: "PRODUCT",
            altFr: product.nameFr,
          },
        });
        url = blob.url;
      }

      // IMAGE-ONLY write: nothing else may change.
      await prisma.product.update({ where: { slug: match.slug }, data: { image: url } });

      const afterRow = (await prisma.product.findUnique({ where: { slug: match.slug } })) as unknown as Record<string, unknown>;
      const diffs = snapshotsEqual(before, snapshotOf(afterRow));
      if (diffs.length > 0) {
        throw new Error(`champs inattendus modifiés: ${diffs.join(", ")}`);
      }
      if (afterRow.image !== url) throw new Error("image non liée");

      updated.push({ slug: match.slug, nameFr: product.nameFr, file: fileName, url });
      console.log(`+ ${match.slug} · ${product.nameFr} · image=${fileName}`);
    } catch (error) {
      skipped.push(`${match.slug} (échec: ${error instanceof Error ? error.message : String(error)})`);
    }
  }

  await prisma.$disconnect();

  writeFileSync(
    "C:/Users/ABDELK~1/AppData/Local/Temp/opencode/fm-images-report.json",
    JSON.stringify({ updated, skipped }, null, 2),
    "utf8",
  );
  console.log(`\nTerminé : ${updated.length} image(s) ajoutée(s), ${skipped.length} ignoré(s).`);
  for (const s of skipped) console.log(`- ${s}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
