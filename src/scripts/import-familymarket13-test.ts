import "dotenv/config";

import { put } from "@vercel/blob";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@/generated/prisma/client";
import { writeFileSync } from "node:fs";

// LOCAL TEST ONLY — one-shot import of 50 products selected from
// familymarket13.com (permission granted by the shop owner) into the database
// configured in the local .env. Never commit, push or deploy this script's
// effects: it only adds NEW rows, it never modifies or deletes existing data.
//
// Idempotent: a product is created only when its slug is absent; a media
// asset is uploaded only when its Family Market filename is absent, otherwise
// the existing hosted image is reused. Safe to run more than once.
//
// Image pipeline mirrors the existing media architecture
// (src/lib/media/validate.ts + src/lib/media/blob.ts + POST /api/media/upload):
// magic-byte MIME sniffing, canonical extension from real content, slugified
// `family-market-[slug].[ext]` filename under media/, Vercel Blob public
// upload, MediaAsset row (category PRODUCT, product name as alt text), then
// Product.image points at the Family Market-hosted URL. Source URLs are never
// stored as product images.

interface ImportItem {
  categorySlug: string;
  nameFr: string;
  size: string;
  price: string;
  imageUrl: string;
}

// Slug: lowercase, no accents, words separated by dashes
// (same rule as src/lib/admin/format.ts slugify).
function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Canonical extension for each detectable image format, copied from the
// existing media validation pipeline (magic bytes win over the filename).
const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/avif": ".avif",
};

function sniffImageMime(bytes: Uint8Array): string | null {
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
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
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
  const isIsoBmff =
    bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70;
  if (isIsoBmff) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (brand === "avif" || brand === "avis") {
      return "image/avif";
    }
  }
  return null;
}

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // same limit as the media pipeline

const ITEMS: ImportItem[] = [
  // Fruits & Légumes (1)
  { categorySlug: "fruits-legumes", nameFr: "MARTIN'S ANANAS 565GR", size: "565 g", price: "850", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/02/1000239406.png" },
  // Boissons (6)
  { categorySlug: "boissons", nameFr: "CAPRI-SUN 330ML", size: "330 ml", price: "500", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/06/1000009389.jpg" },
  { categorySlug: "boissons", nameFr: "COCA COLA ÉDITION 007 (ZÉRO CAFÉINE 33CL)", size: "33 cl", price: "400", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/05/1000007648.jpg" },
  { categorySlug: "boissons", nameFr: "SPRITE 2L", size: "2 L", price: "140", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/11/1000000298.jpg" },
  { categorySlug: "boissons", nameFr: "RAMY JUS 1L 100%", size: "1 L", price: "240", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/08/1000013147.jpg" },
  { categorySlug: "boissons", nameFr: "MANSOURAH EAU 1.5L", size: "1.5 L", price: "45", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/08/Design-sans-titre-2025-08-09T121112.731.png" },
  { categorySlug: "boissons", nameFr: "SELECTO CANETTE 33CL", size: "33 cl", price: "60", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7448-1.jpg" },
  // Produits Laitiers (5)
  { categorySlug: "produits-laitiers", nameFr: "CANDIA VIVA 1L", size: "1 L", price: "130", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/06/Untitled-design-13.png" },
  { categorySlug: "produits-laitiers", nameFr: "SOUMMAM GREEK NATURE 150GR", size: "150 g", price: "70", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/03/1000263602.jpg" },
  { categorySlug: "produits-laitiers", nameFr: "lacta yaourt aromatise 350g", size: "350 g", price: "95", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/09/Design-sans-titre-2025-09-21T181913.359.webp" },
  { categorySlug: "produits-laitiers", nameFr: "PRÉSIDENT RONDELÉ AIL 140GR", size: "140 g", price: "280", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/03/1000006046.jpg" },
  { categorySlug: "produits-laitiers", nameFr: "RAMDY FROMAGE X24", size: "X24", price: "400", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/01/1000004470.jpg" },
  // Épicerie (5)
  { categorySlug: "epicerie", nameFr: "safina couscous fin 1kg", size: "1 kg", price: "150", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/07/Design-sans-titre-2025-07-30T124102.521.webp" },
  { categorySlug: "epicerie", nameFr: "WARDA SPAGHETTI 500GR", size: "500 g", price: "120", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/09/1000014311.jpg" },
  { categorySlug: "epicerie", nameFr: "NIZIERE CAFÉ EDEN 250GR", size: "250 g", price: "340", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/07/1000011955.jpg" },
  { categorySlug: "epicerie", nameFr: "CEVITAL SUCRE 1KG", size: "1 kg", price: "95", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/08/Design-sans-titre-2025-08-02T215020.645.webp" },
  { categorySlug: "epicerie", nameFr: "AL MISHKAT HUILE D'OLIVE 1L", size: "1 L", price: "900", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/06/1000009421.jpg" },
  // Surgelés (4)
  { categorySlug: "surgeles", nameFr: "DAYZY BÂTONNETS DE POULET / NUGGETS DE POULET 300GR", size: "300 g", price: "360", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/07/1000011607.jpg" },
  { categorySlug: "surgeles", nameFr: "ESPADON 500GR", size: "500 g", price: "450", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/06/1000300084.jpg" },
  { categorySlug: "surgeles", nameFr: "green frost petit pois 1kg", size: "1 kg", price: "550", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/09/Design-sans-titre-2025-09-04T092419.388.webp" },
  { categorySlug: "surgeles", nameFr: "BEKS MINI CHAUSSONS 480GR", size: "480 g", price: "450", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7432.jpg" },
  // Biscuits & Confiseries (5)
  { categorySlug: "biscuits-confiseries", nameFr: "MINI CONES 70GR PISTACHE/KINDER", size: "70 g", price: "140", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/06/1000010616.jpg" },
  { categorySlug: "biscuits-confiseries", nameFr: "TOBLERONE CHOCOLAT 100GR", size: "100 g", price: "800", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/11/1000207123.jpg" },
  { categorySlug: "biscuits-confiseries", nameFr: "KRACK'S 40GR biscuit sale", size: "40 g", price: "35", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/06/1000010618.jpg" },
  { categorySlug: "biscuits-confiseries", nameFr: "DARNI CRACKERS 35G", size: "35 g", price: "60", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/06/1000010610.jpg" },
  { categorySlug: "biscuits-confiseries", nameFr: "PRINGELS CHIPS 195G", size: "195 g", price: "1100", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7724.jpg" },
  // Hygiène & Beauté (4)
  { categorySlug: "hygiene-beaute", nameFr: "NIVEA DEO 250ML FEMME", size: "250 ml", price: "1200", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/08/1000013368.jpg" },
  { categorySlug: "hygiene-beaute", nameFr: "COLGATE BAD SLIM X2", size: "X2", price: "340", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/08/1000307389.jpg" },
  { categorySlug: "hygiene-beaute", nameFr: "ETINIA GEL DOUCHE 600ML", size: "600 ml", price: "300", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/08/1000013308.jpg" },
  { categorySlug: "hygiene-beaute", nameFr: "MOULIN VERT HUILE DE COCO 170ML", size: "170 ml", price: "750", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/09/1000014283.jpg" },
  // Produits d'Entretien (4)
  { categorySlug: "produits-entretien", nameFr: "AZUL ASSOUPLISSANT 1.6L", size: "1.6 L", price: "1200", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/09/1000311955.jpg" },
  { categorySlug: "produits-entretien", nameFr: "AIGLE JAVEL 5L", size: "5 L", price: "320", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/07/1000012105.jpg" },
  { categorySlug: "produits-entretien", nameFr: "AIGLE LIQUIDE VAISSELLE 650ML", size: "650 ml", price: "200", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/07/1000012053-1.jpg" },
  { categorySlug: "produits-entretien", nameFr: "FRESH WIND DESODORISANT 400ML", size: "400 ml", price: "450", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_7087.jpg" },
  // Produits pour la Maison (4)
  { categorySlug: "produits-maison", nameFr: "COTEX PAPIER CUISSON 50M", size: "50 m", price: "680", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/06/1000010866.jpg" },
  { categorySlug: "produits-maison", nameFr: "COTEX FILM 200M", size: "200 m", price: "900", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/06/1000010864.jpg" },
  { categorySlug: "produits-maison", nameFr: "SAC CUISSON AU FOUR X8", size: "X8", price: "90", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7348.jpg" },
  { categorySlug: "produits-maison", nameFr: "GRIGRI SUPERGAZ 200ML", size: "200 ml", price: "120", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_6493.png" },
  // Produits pour Bébé (4)
  { categorySlug: "produits-bebe", nameFr: "BIMBIES SPLASH 4 (9 pièces)", size: "9 pièces", price: "310", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/07/1000012259.jpg" },
  { categorySlug: "produits-bebe", nameFr: "p'tit ours talc bebe 200gr", size: "200 g", price: "550", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/06/6.webp" },
  { categorySlug: "produits-bebe", nameFr: "johnson's huile bebe 300ml", size: "300 ml", price: "950", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/06/Untitled-design-54.webp" },
  { categorySlug: "produits-bebe", nameFr: "natura pro shampooing bebe 500ml", size: "500 ml", price: "240", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/06/Untitled-design-59-1.webp" },
  // Céréales & Petit Déjeuner (4)
  { categorySlug: "cereales-petit-dejeuner", nameFr: "NESTLÉ CHOCAPIC 645G", size: "645 g", price: "1950", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/09/1000014242.jpg" },
  { categorySlug: "cereales-petit-dejeuner", nameFr: "TWISCO CHOCOLAT POUDRE 500GR", size: "500 g", price: "360", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/06/1000010884.jpg" },
  { categorySlug: "cereales-petit-dejeuner", nameFr: "TAKELAIT BISCOTTE BLÉ COMPLET 500GR", size: "500 g", price: "240", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/11/1000001264.jpg" },
  { categorySlug: "cereales-petit-dejeuner", nameFr: "Arruapan pain burger X6", size: "X6", price: "140", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/09/1000173103.jpg" },
  // Conserves & Sauces (4)
  { categorySlug: "conserves-sauces", nameFr: "MAHBOUBA TOMATES CONCENTRÉ 400GR", size: "400 g", price: "160", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/11/1000000265.jpg" },
  { categorySlug: "conserves-sauces", nameFr: "HEINZ KETCHUP 300ML", size: "300 ml", price: "800", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/05/1000007750.jpg" },
  { categorySlug: "conserves-sauces", nameFr: "NOOR MAYONNAISE ORIGINALE 450ML", size: "450 ml", price: "270", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/06/1000009305.jpg" },
  { categorySlug: "conserves-sauces", nameFr: "THIKA MAIS 380 G", size: "380 g", price: "200", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7377.jpg" },
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadImage(url: string): Promise<Buffer> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": "FamilyMarketLocalTest/1.0" },
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return Buffer.from(await res.arrayBuffer());
      } finally {
        clearTimeout(timer);
      }
    } catch (error) {
      lastError = error;
      await sleep(1000 * attempt);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("download failed");
}

async function main(): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
    console.error("Stockage Blob non configuré (BLOB_READ_WRITE_TOKEN manquant).");
    process.exit(1);
  }

  // The embedded list must contain unique slugs, otherwise abort loudly
  // instead of risking a wrong skip/overwrite.
  const slugs = ITEMS.map((item) => slugify(item.nameFr));
  const seen = new Set<string>();
  for (const slug of slugs) {
    if (seen.has(slug)) {
      console.error(`Slug dupliqué dans la liste d'import : ${slug}`);
      process.exit(1);
    }
    seen.add(slug);
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const productsBefore = await prisma.product.count();

  const categories = await prisma.category.findMany({
    select: { id: true, slug: true, isActive: true },
  });
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));
  const missingCategories = [...new Set(ITEMS.map((i) => i.categorySlug))].filter(
    (slug) => !categoryBySlug.has(slug),
  );
  if (missingCategories.length > 0) {
    console.error(`Catégories introuvables : ${missingCategories.join(", ")}`);
    await prisma.$disconnect();
    process.exit(1);
  }

  const existingProducts = await prisma.product.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true, nameFr: true, size: true },
  });
  const existingBySlug = new Map(existingProducts.map((p) => [p.slug, p]));

  const mediaNames = slugs.map((slug) => `family-market-${slug}`);
  const existingMedia = await prisma.mediaAsset.findMany({
    where: { name: { in: mediaNames } },
    select: { name: true, url: true, mimeType: true },
  });
  const mediaByName = new Map(existingMedia.map((m) => [m.name, m]));

  let created = 0;
  let mediaUploaded = 0;
  let mediaReused = 0;
  let withoutImage = 0;
  const skipped: string[] = [];
  const report: {
    nameFr: string;
    category: string;
    size: string;
    price: string;
    imageDownloaded: boolean;
    imageFile: string | null;
  }[] = [];

  for (let index = 0; index < ITEMS.length; index += 1) {
    const item = ITEMS[index];
    const slug = slugs[index];
    const mediaName = `family-market-${slug}`;

    const already = existingBySlug.get(slug);
    if (already) {
      skipped.push(`${slug} · ${item.nameFr} (déjà présent)`);
      continue;
    }

    // Polite pace between source downloads.
    if (index > 0) {
      await sleep(300);
    }

    let imageUrl: string | null = null;
    let imageFile: string | null = null;
    let imageDownloaded = false;

    const reused = mediaByName.get(mediaName);
    if (reused) {
      imageUrl = reused.url;
      mediaReused += 1;
      imageDownloaded = true;
      const ext = EXTENSION_BY_MIME[reused.mimeType ?? ""] ?? "";
      imageFile = `${mediaName}${ext}`;
    } else {
      try {
        const bytes = await downloadImage(item.imageUrl);
        if (bytes.length === 0 || bytes.length > MAX_IMAGE_SIZE_BYTES) {
          throw new Error(`taille invalide (${bytes.length} octets)`);
        }
        const mimeType = sniffImageMime(bytes);
        if (!mimeType) {
          throw new Error("contenu image non reconnu");
        }
        const extension = EXTENSION_BY_MIME[mimeType];
        const fileName = `${mediaName}${extension}`;
        const body = new Uint8Array(bytes.length);
        body.set(bytes);
        const blob = await put(`media/${mediaName}${extension}`, new File([body], fileName, { type: mimeType }), {
          access: "public",
          contentType: mimeType,
          addRandomSuffix: true,
          allowOverwrite: false,
        });
        await prisma.mediaAsset.create({
          data: {
            name: fileName,
            url: blob.url,
            type: "image",
            mimeType,
            size: bytes.length,
            category: "PRODUCT",
            altFr: item.nameFr,
            altAr: null,
          },
        });
        mediaByName.set(mediaName, { name: fileName, url: blob.url, mimeType });
        imageUrl = blob.url;
        imageFile = fileName;
        imageDownloaded = true;
        mediaUploaded += 1;
      } catch (error) {
        console.error(`! image ignorée pour ${slug} : ${error instanceof Error ? error.message : error}`);
      }
    }

    if (!imageDownloaded) {
      withoutImage += 1;
    }

    await prisma.product.create({
      data: {
        nameFr: item.nameFr,
        nameAr: "",
        slug,
        descriptionFr: null,
        descriptionAr: null,
        size: item.size,
        sku: null,
        price: new Prisma.Decimal(item.price),
        salePrice: null,
        image: imageUrl,
        isAvailable: true,
        categoryId: categoryBySlug.get(item.categorySlug)!.id,
      },
    });
    created += 1;
    console.log(
      `+ ${slug} · ${item.nameFr} · ${item.size} · ${item.price} DA · image=${imageDownloaded ? imageFile : "non"}`,
    );
    report.push({
      nameFr: item.nameFr,
      category: item.categorySlug,
      size: item.size,
      price: item.price,
      imageDownloaded,
      imageFile,
    });
  }

  const productsAfter = await prisma.product.count();
  await prisma.$disconnect();

  writeFileSync(
    "C:/Users/ABDELK~1/AppData/Local/Temp/opencode/fm13-import-report.json",
    JSON.stringify(
      { productsBefore, productsAfter, created, mediaUploaded, mediaReused, withoutImage, skipped, report },
      null,
      1,
    ),
  );

  console.log(`\nTerminé : ${created} produit(s) créé(s) (${productsBefore} → ${productsAfter}).`);
  console.log(`Médias : ${mediaUploaded} upload(s), ${mediaReused} réutilisé(s), ${withoutImage} produit(s) sans image.`);
  if (skipped.length > 0) {
    console.log(`Ignorés (déjà présents, aucun écrasement) — ${skipped.length} :`);
    console.log(skipped.map((entry) => `- ${entry}`).join("\n"));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
