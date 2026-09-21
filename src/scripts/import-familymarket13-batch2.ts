import "dotenv/config";

import { put } from "@vercel/blob";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@/generated/prisma/client";
import { writeFileSync } from "node:fs";

// Batch-2 import of NEW products selected from familymarket13.com
// (permission granted by the shop owner) into the database configured
// in the local .env. Additive only: it creates NEW Product + MediaAsset
// rows, it never updates, deletes, or touches existing data.
//
// Idempotent: a product is created only when neither its slug nor its
// normalized (nameFr + size) matches an existing product; a media asset
// is uploaded only when its `family-market-[slug]` name is absent,
// otherwise the existing hosted image is reused. Safe to run again.
//
// Image pipeline mirrors the existing media architecture
// (src/lib/media/validate.ts + src/lib/media/blob.ts + POST /api/media/upload):
// magic-byte MIME sniffing, canonical extension from real content,
// `family-market-[slug]` name under media/, Vercel Blob public upload,
// MediaAsset row (category PRODUCT, product name as alt text), then
// Product.image points at the Family Market-hosted URL. Source URLs are
// never stored as product images.
//
// The BLOB token must come from the environment (BLOB_READ_WRITE_TOKEN).
// It is never written to any file by this script.

interface ImportItem {
  categorySlug: string;
  nameFr: string;
  size: string;
  price: string;
  imageUrl: string;
  isAvailable?: boolean;
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

function norm(s: string): string {
  return slugify(s).replace(/-/g, " ").replace(/\s+/g, " ").trim();
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
  // ---------- Boissons (20) ----------
  { categorySlug: "boissons", nameFr: "RAMY EXTRA 300ML", size: "300 ml", price: "50", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7466-1.jpg" },
  { categorySlug: "boissons", nameFr: "IZEM ENERGY 330ML", size: "330 ml", price: "60", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7458-1.jpg" },
  { categorySlug: "boissons", nameFr: "SPRITE 24CL", size: "24 cl", price: "40", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7465-1.jpg" },
  { categorySlug: "boissons", nameFr: "ROUIBA EXCELLENCE JUS 25CL", size: "25 cl", price: "65", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7462-1.jpg" },
  { categorySlug: "boissons", nameFr: "SCHWEPPES GOLD 30CL", size: "30 cl", price: "60", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7459-1.jpg" },
  { categorySlug: "boissons", nameFr: "COCA COLA CANETTE 25CL", size: "25 cl", price: "70", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7453-1.jpg" },
  { categorySlug: "boissons", nameFr: "MIRINDA CANETTE 33CL", size: "33 cl", price: "75", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7437.jpg" },
  { categorySlug: "boissons", nameFr: "PEPSI BLACK CANETTE 330ML", size: "330 ml", price: "75", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7436.jpg" },
  { categorySlug: "boissons", nameFr: "7 UP CANETTE 33CL", size: "33 cl", price: "75", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7442-1.jpg" },
  { categorySlug: "boissons", nameFr: "ROUIBA JUS 20CL PAILLE", size: "20 cl", price: "25", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7469-1.jpg" },
  { categorySlug: "boissons", nameFr: "RAMY MILKY 20CL", size: "20 cl", price: "40", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7472-1.jpg" },
  { categorySlug: "boissons", nameFr: "CANDIA TWIST 20CL", size: "20 cl", price: "45", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7473-1.jpg" },
  { categorySlug: "boissons", nameFr: "CANDIA CHOCO 20CL", size: "20 cl", price: "60", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7464-1.jpg" },
  { categorySlug: "boissons", nameFr: "CANDIA JUS PAILLE 20CL", size: "20 cl", price: "35", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7474-1.jpg" },
  { categorySlug: "boissons", nameFr: "IFRI IZEM ENERGY 25CL", size: "25 cl", price: "80", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7454-1.jpg" },
  { categorySlug: "boissons", nameFr: "L'EXQUISE SODA 33CL", size: "33 cl", price: "40", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7450.jpg" },
  { categorySlug: "boissons", nameFr: "MOUZAIA 1L", size: "1 L", price: "75", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/photo_43_2024_12_20_19_55_11.jpg" },
  { categorySlug: "boissons", nameFr: "ROUIBA JUS 1L", size: "1 L", price: "120", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/photo_42_2024_12_20_19_55_11.jpg" },
  { categorySlug: "boissons", nameFr: "TCHINA JUS 1L", size: "1 L", price: "110", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/photo_40_2024_12_20_19_55_11.jpg" },
  { categorySlug: "boissons", nameFr: "EAU MINERAL GUEDILA 1.5L", size: "1.5 L", price: "40", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/06/Untitled-design-5.png" },
  // ---------- Produits Laitiers (20) ----------
  { categorySlug: "produits-laitiers", nameFr: "CHEEZY 16P", size: "16 pcs", price: "185", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_5993.png" },
  { categorySlug: "produits-laitiers", nameFr: "CHEEZY 24P", size: "24 pcs", price: "270", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_5994.png" },
  { categorySlug: "produits-laitiers", nameFr: "picon 16p", size: "16 pcs", price: "145", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_5997.png" },
  { categorySlug: "produits-laitiers", nameFr: "LA VACHE QUI RIT FROMAGE X16", size: "16 pcs", price: "200", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/1000187066.jpg" },
  { categorySlug: "produits-laitiers", nameFr: "LA VACHE QUI RIT FROMAGE X24", size: "24 pcs", price: "295", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/1000187068.jpg" },
  { categorySlug: "produits-laitiers", nameFr: "PRESIDENT 24PCS", size: "24 pcs", price: "350", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_6003.png" },
  { categorySlug: "produits-laitiers", nameFr: "PRESIDENT 16PCS", size: "16 pcs", price: "260", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_6004.png" },
  { categorySlug: "produits-laitiers", nameFr: "SELECTION FROMAGE X8", size: "8 pcs", price: "140", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_6005.png" },
  { categorySlug: "produits-laitiers", nameFr: "PICON 24PCS", size: "24 pcs", price: "215", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_6009.png" },
  { categorySlug: "produits-laitiers", nameFr: "LA VACHE QUI RIT FROMAGE X8", size: "8 pcs", price: "105", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/1000187067.jpg" },
  { categorySlug: "produits-laitiers", nameFr: "TARTINO", size: "1 pièce", price: "250", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_6014.png" },
  { categorySlug: "produits-laitiers", nameFr: "CHEEZY SLICE HAMBURGER 170G", size: "170 g", price: "200", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_6015.png" },
  { categorySlug: "produits-laitiers", nameFr: "LE BERBER FROMAGE 150G", size: "150 g", price: "140", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_6019.png" },
  { categorySlug: "produits-laitiers", nameFr: "SIPLAIT FROMAGE 280G", size: "280 g", price: "200", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_6024.png" },
  { categorySlug: "produits-laitiers", nameFr: "PRESIDENT FROMAGE 300G", size: "300 g", price: "550", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_6025.png" },
  { categorySlug: "produits-laitiers", nameFr: "SOUMMAM JNIINA", size: "1 pot", price: "30", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/5.png" },
  { categorySlug: "produits-laitiers", nameFr: "SOUMMAM CEREALO", size: "1 pot", price: "30", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_6142.png" },
  { categorySlug: "produits-laitiers", nameFr: "SOUMMAM NATURE", size: "1 pot", price: "25", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_6145.png" },
  { categorySlug: "produits-laitiers", nameFr: "CANDIA LAIT 1L", size: "1 L", price: "125", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/06/Untitled-design-12.png" },
  { categorySlug: "produits-laitiers", nameFr: "LOYA 500G SACHETS", size: "500 g", price: "620", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/Design-sans-titre-52.png" },
  // ---------- Épicerie (20) ----------
  { categorySlug: "epicerie", nameFr: "Warda Tagliatelle 250g", size: "250 g", price: "300", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/09/1000014315.jpg" },
  { categorySlug: "epicerie", nameFr: "Warda Lasagne 500g", size: "500 g", price: "340", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/09/1000014316-1.jpg" },
  { categorySlug: "epicerie", nameFr: "Dar Samar Riz Étuvé 1kg", size: "1 kg", price: "150", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/07/1000011762.jpg" },
  { categorySlug: "epicerie", nameFr: "Ebly L'Original 500g", size: "500 g", price: "1350", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/05/1000007653.jpg" },
  { categorySlug: "epicerie", nameFr: "Garrido Penne 500g", size: "500 g", price: "110", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/09/1000175360.jpg" },
  { categorySlug: "epicerie", nameFr: "Mahbouba Lasagne 500g", size: "500 g", price: "180", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_6666.jpg" },
  { categorySlug: "epicerie", nameFr: "Mama Farine 1kg T45", size: "1 kg", price: "85", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/07/Farine_T45_FR-1-400x400-1.webp" },
  { categorySlug: "epicerie", nameFr: "Mama Couscous Gros 1kg", size: "1 kg", price: "175", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/07/couscous-gros-1-400x400-1.webp" },
  { categorySlug: "epicerie", nameFr: "Safina Semoule Demi-Gros 1kg", size: "1 kg", price: "100", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/07/Design-sans-titre-2025-07-30T123635.780.webp" },
  { categorySlug: "epicerie", nameFr: "Victoria Levure 500g", size: "500 g", price: "370", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/07/Design-sans-titre-2025-07-30T123740.468.webp" },
  { categorySlug: "epicerie", nameFr: "Lavazza Oro Grain 100% Arabica 500g", size: "500 g", price: "4000", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/09/1000014660.jpg" },
  { categorySlug: "epicerie", nameFr: "Lipton Thé x25", size: "25 sachets", price: "320", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/06/1000009377.jpg" },
  { categorySlug: "epicerie", nameFr: "Nescafé Gold 100g", size: "100 g", price: "1250", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/12/1000215082.jpg" },
  { categorySlug: "epicerie", nameFr: "Cevital Sucre 5kg", size: "5 kg", price: "450", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/08/Design-sans-titre-2025-08-02T215055.506.webp" },
  { categorySlug: "epicerie", nameFr: "Casbah Vinaigre 750ml", size: "750 ml", price: "125", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/09/1000014621.jpg" },
  { categorySlug: "epicerie", nameFr: "Cevital Fleurial Huile 4L", size: "4 L", price: "1400", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/07/Design-sans-titre-81.png" },
  { categorySlug: "epicerie", nameFr: "Elio Huile 5L", size: "5 L", price: "650", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/Design-sans-titre-74-2.webp" },
  { categorySlug: "epicerie", nameFr: "Labelle Smen 500g", size: "500 g", price: "200", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7232.jpg" },
  { categorySlug: "epicerie", nameFr: "Chemsi Sel de Cuisine 1kg", size: "1 kg", price: "35", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7180.jpg" },
  { categorySlug: "epicerie", nameFr: "Jumbo Bouillon Tab x8", size: "x8", price: "115", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7609.jpg" },
  // ---------- Surgelés (20) ----------
  { categorySlug: "surgeles", nameFr: "Dayzy Burger de Poulet", size: "1 kg", price: "600", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/07/1000011605.jpg" },
  { categorySlug: "surgeles", nameFr: "Surimi 250g", size: "250 g", price: "350", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/06/1000010854.jpg" },
  { categorySlug: "surgeles", nameFr: "Pescar Crevette Entière Congelée 800g", size: "800 g", price: "3500", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/02/1000005739.jpg" },
  { categorySlug: "surgeles", nameFr: "Beks Chaussons aux Pesto", size: "480 g", price: "400", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/02/1000005153.png" },
  { categorySlug: "surgeles", nameFr: "Beks Chaussons aux Crevettes", size: "480 g", price: "400", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/02/1000005155.jpg" },
  { categorySlug: "surgeles", nameFr: "Beks Mini Chaussons Grillagé Poulet & Champignon", size: "480 g", price: "400", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/02/1000239860.jpg" },
  { categorySlug: "surgeles", nameFr: "Obaida Crispy 600g", size: "600 g", price: "300", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/01/1000003730.jpg" },
  { categorySlug: "surgeles", nameFr: "Obaida Broasted 600g", size: "600 g", price: "300", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/01/1000003731.jpg" },
  { categorySlug: "surgeles", nameFr: "VG Frites 750g", size: "750 g", price: "240", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/01/1000003729.jpg" },
  { categorySlug: "surgeles", nameFr: "Obaida Wings 700g", size: "700 g", price: "300", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/01/1000225256.jpg" },
  { categorySlug: "surgeles", nameFr: "Beks Msemen Surgelé", size: "500 g", price: "400", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/10/1000187073-1.jpg" },
  { categorySlug: "surgeles", nameFr: "Pâte Brisée 500g", size: "500 g", price: "160", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/09/Design-sans-titre-2025-09-04T092352.951.webp" },
  { categorySlug: "surgeles", nameFr: "Filet de Panga", size: "1 kg", price: "1100", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7423-2.jpg" },
  { categorySlug: "surgeles", nameFr: "Cap de Fer Merlan 1kg", size: "1 kg", price: "1300", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7424-1.jpg" },
  { categorySlug: "surgeles", nameFr: "Forstar Crevette 500g", size: "500 g", price: "950", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7425-1.jpg" },
  { categorySlug: "surgeles", nameFr: "Primeur Cocktail de Fruits de Mer 500g", size: "500 g", price: "500", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7426-1.jpg" },
  { categorySlug: "surgeles", nameFr: "Bâtonnets de Poisson 250g", size: "250 g", price: "430", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7427-1.jpg" },
  { categorySlug: "surgeles", nameFr: "Food Royale Haricots Congelés 400g", size: "400 g", price: "200", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7429-1.jpg" },
  { categorySlug: "surgeles", nameFr: "Calamar Anneaux Congelés 500g", size: "500 g", price: "800", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7434.jpg" },
  { categorySlug: "surgeles", nameFr: "Filet de Saumon 500g", size: "500 g", price: "980", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7435.jpg" },
  // ---------- Biscuits & Confiseries (20) ----------
  { categorySlug: "biscuits-confiseries", nameFr: "REGINAT PETIT BEURRE 140GR SANS GLUTEN", size: "140 g", price: "250", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/07/1000011953.jpg" },
  { categorySlug: "biscuits-confiseries", nameFr: "LALLA INES KAAK TRADITIONNEL 10PIECES", size: "10 pièces", price: "150", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/06/1000009398-1.jpg" },
  { categorySlug: "biscuits-confiseries", nameFr: "PRINCE AU BLÉ COMPLET 300G", size: "300 g", price: "650", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/05/1000007667.jpg" },
  { categorySlug: "biscuits-confiseries", nameFr: "BELIN MINIZZA 95G", size: "95 g", price: "600", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/05/1000007660.jpg" },
  { categorySlug: "biscuits-confiseries", nameFr: "LU HEUDEBERT BISCOTTE 300GR", size: "300 g", price: "800", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/05/1000007625.jpg" },
  { categorySlug: "biscuits-confiseries", nameFr: "LU PETIT ECOLIER CHOCOLAT AU LAIT 150G", size: "150 g", price: "800", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/07/IMG_20250724_113917.webp" },
  { categorySlug: "biscuits-confiseries", nameFr: "NAYA BOUDOIRS 195GR", size: "195 g", price: "200", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/02/1000005490.png" },
  { categorySlug: "biscuits-confiseries", nameFr: "BISSANOLA PALTES BRETONS 180G", size: "180 g", price: "200", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_6904.jpg" },
  { categorySlug: "biscuits-confiseries", nameFr: "MAGICO BISCUIT 130G", size: "130 g", price: "180", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_6881.jpg" },
  { categorySlug: "biscuits-confiseries", nameFr: "KEKS PETITE GALETTE 100G", size: "100 g", price: "200", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_6903.jpg" },
  { categorySlug: "biscuits-confiseries", nameFr: "KIT KAT", size: "1 pièce", price: "200", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/07/1000303446.jpg" },
  { categorySlug: "biscuits-confiseries", nameFr: "KINDER COUNTRY X1", size: "X1", price: "220", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/12/1000215116.jpg" },
  { categorySlug: "biscuits-confiseries", nameFr: "KINDER CHOCOLAT 12 BATTONS", size: "X12", price: "1300", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/12/1000002704.jpg" },
  { categorySlug: "biscuits-confiseries", nameFr: "LINDT LES GRANDES", size: "1 pièce", price: "1700", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/12/1000215107.jpg" },
  { categorySlug: "biscuits-confiseries", nameFr: "NESTLE LION BARRE", size: "1 pièce", price: "250", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/12/1000215097.jpg" },
  { categorySlug: "biscuits-confiseries", nameFr: "Raffaello x22", size: "X22", price: "2100", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/09/1000172471.jpg" },
  { categorySlug: "biscuits-confiseries", nameFr: "tic tac 18gr", size: "18 g", price: "350", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/05/1000007594.jpg" },
  { categorySlug: "biscuits-confiseries", nameFr: "mentos chewyngum 30gr", size: "30 g", price: "260", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/09/Design-sans-titre-2025-09-17T170554.533.webp" },
  { categorySlug: "biscuits-confiseries", nameFr: "VICHY PASTILLE MENTHE 230GR", size: "230 g", price: "1000", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/09/1000014255.jpg" },
  { categorySlug: "biscuits-confiseries", nameFr: "maruja 1917 lait 90g", size: "90 g", price: "280", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/09/Design-sans-titre-2025-09-17T171957.487.webp" },
  // ---------- Snacks & Apéritifs (20) ----------
  { categorySlug: "Snacks & Apéritifs", nameFr: "DADI CHIPS", size: "1 pièce", price: "30", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/07/1000011649.jpg" },
  { categorySlug: "Snacks & Apéritifs", nameFr: "GURMA CHIPS", size: "1 pièce", price: "60", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/06/1000011036.jpg" },
  { categorySlug: "Snacks & Apéritifs", nameFr: "MAHBOUL THE BOX CHIPS 125GR", size: "125 g", price: "190", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/10/1000178081.jpg" },
  { categorySlug: "Snacks & Apéritifs", nameFr: "kritch chips 50g", size: "50 g", price: "70", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/09/Design-sans-titre-2025-09-18T151920.817.webp" },
  { categorySlug: "Snacks & Apéritifs", nameFr: "FLAYK CHIPS 40G", size: "40 g", price: "170", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7727.jpg" },
  { categorySlug: "Snacks & Apéritifs", nameFr: "FLAYK CHIPS 75G", size: "75 g", price: "220", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7719.jpg" },
  { categorySlug: "Snacks & Apéritifs", nameFr: "FLAYK CHIPS 160GR", size: "160 g", price: "330", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7723.jpg" },
  { categorySlug: "Snacks & Apéritifs", nameFr: "FLAYK CHIPS 45G", size: "45 g", price: "170", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7728-1.jpg" },
  { categorySlug: "Snacks & Apéritifs", nameFr: "MASTER CHIPS", size: "1 pièce", price: "30", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7614.jpg" },
  { categorySlug: "Snacks & Apéritifs", nameFr: "MAHBOUL CHIPS", size: "1 pièce", price: "60", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7634.jpg" },
  { categorySlug: "Snacks & Apéritifs", nameFr: "MAHBOUL CHIPS CHEBKA", size: "1 pièce", price: "30", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7630.jpg" },
  { categorySlug: "Snacks & Apéritifs", nameFr: "MAHBOUL CRUNCHY CHIPS", size: "1 pièce", price: "60", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7628.jpg" },
  { categorySlug: "Snacks & Apéritifs", nameFr: "RIFKUS CHIPS 40G", size: "40 g", price: "60", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7616.jpg" },
  { categorySlug: "Snacks & Apéritifs", nameFr: "LAYS CHIPS 150GR", size: "150 g", price: "950", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/11/1000001800.jpg", isAvailable: false },
  { categorySlug: "Snacks & Apéritifs", nameFr: "PRINGLES 175G", size: "175 g", price: "1100", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/07/IMG_20250724_113748.webp", isAvailable: false },
  { categorySlug: "Snacks & Apéritifs", nameFr: "MASTER POTATO 110G", size: "110 g", price: "650", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/07/IMG_20250724_114132.webp", isAvailable: false },
  { categorySlug: "Snacks & Apéritifs", nameFr: "CAM CORN CURLS 150GR", size: "150 g", price: "200", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/06/1000010577.jpg", isAvailable: false },
  { categorySlug: "Snacks & Apéritifs", nameFr: "rifkus chips 40g Rupture", size: "40 g", price: "60", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/09/Design-sans-titre-2025-09-18T152044.861.webp", isAvailable: false },
  { categorySlug: "Snacks & Apéritifs", nameFr: "RIFKUS CHIPS 40G Lot", size: "40 g", price: "60", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7617.jpg", isAvailable: false },
  { categorySlug: "Snacks & Apéritifs", nameFr: "RIFKUS CHIPS Classique", size: "1 pièce", price: "60", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7622.jpg", isAvailable: false },
  // ---------- Hygiène & Beauté (20) ----------
  { categorySlug: "hygiene-beaute", nameFr: "Ameerat Al Hoob 250ml", size: "250 ml", price: "600", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/08/1000307405.jpg" },
  { categorySlug: "hygiene-beaute", nameFr: "Be Black Man 200ml", size: "200 ml", price: "240", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/08/1000307404.jpg" },
  { categorySlug: "hygiene-beaute", nameFr: "VG Brume 250ml", size: "250 ml", price: "750", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/08/1000307406.jpg" },
  { categorySlug: "hygiene-beaute", nameFr: "VG Gommage Hydro Clean 150ml", size: "150 ml", price: "500", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/08/1000307411.jpg" },
  { categorySlug: "hygiene-beaute", nameFr: "Lady Fresh Deo 150ml", size: "150 ml", price: "360", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/08/1000307409.jpg" },
  { categorySlug: "hygiene-beaute", nameFr: "Make Huile Biphasee 150ml", size: "150 ml", price: "850", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/08/1000307391.jpg" },
  { categorySlug: "hygiene-beaute", nameFr: "Make Creme Ecran Total 50ml", size: "50 ml", price: "750", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/08/1000307379.jpg" },
  { categorySlug: "hygiene-beaute", nameFr: "Biolila Creme de Jour 50ml", size: "50 ml", price: "500", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/08/1000013369.jpg" },
  { categorySlug: "hygiene-beaute", nameFr: "Revelation Secrete Serum 100ml", size: "100 ml", price: "400", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/08/1000013361.jpg" },
  { categorySlug: "hygiene-beaute", nameFr: "Bioness Glow Intime 100ml", size: "100 ml", price: "650", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/08/1000013337.jpg" },
  { categorySlug: "hygiene-beaute", nameFr: "Lostral Savon Indigo 120gr", size: "120 g", price: "400", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/01/1000225259.jpg" },
  { categorySlug: "hygiene-beaute", nameFr: "Malizia Gel Douche 400ml", size: "400 ml", price: "520", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/12/1000002110.jpg" },
  { categorySlug: "hygiene-beaute", nameFr: "Deliplus Bicarbonato 100ml", size: "100 ml", price: "700", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/11/1000001483.jpg" },
  { categorySlug: "hygiene-beaute", nameFr: "Deliplus Repair Mask 400ml", size: "400 ml", price: "1200", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/11/1000001391.jpg" },
  { categorySlug: "hygiene-beaute", nameFr: "Deliplus Anti Hairloss 250ml", size: "250 ml", price: "1350", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/11/1000001329.jpg" },
  { categorySlug: "hygiene-beaute", nameFr: "Rexona Men Deo 200ml", size: "200 ml", price: "1200", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/11/1000001305.jpg" },
  { categorySlug: "hygiene-beaute", nameFr: "Deliplus Brume 250ml", size: "250 ml", price: "1700", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/11/1000001289.jpg" },
  { categorySlug: "hygiene-beaute", nameFr: "Lostral Sel de Bain", size: "500 g", price: "300", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/10/1000188997.jpg" },
  { categorySlug: "hygiene-beaute", nameFr: "Lostral Charbon Actif", size: "100 g", price: "400", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/10/1000188998.jpg" },
  { categorySlug: "hygiene-beaute", nameFr: "Lostral Pure Coco 160gr", size: "160 g", price: "450", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/10/1000188996.jpg" },
  // ---------- Produits d'Entretien (20) ----------
  { categorySlug: "produits-entretien", nameFr: "Isis Lessive Machine 3L", size: "3 L", price: "630", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/08/1000013259.jpg" },
  { categorySlug: "produits-entretien", nameFr: "Isis Sachet 300gr", size: "300 g", price: "75", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/08/1000013256-1.jpg" },
  { categorySlug: "produits-entretien", nameFr: "Isis Sachet 750gr Multi-Usages", size: "750 g", price: "180", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/08/1000013256.jpg" },
  { categorySlug: "produits-entretien", nameFr: "Aigle Poudre Linge 1kg", size: "1 kg", price: "280", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/07/1000012243.jpg" },
  { categorySlug: "produits-entretien", nameFr: "Aigle Gel Nadhif 1L", size: "1 L", price: "250", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/07/1000012238.jpg" },
  { categorySlug: "produits-entretien", nameFr: "Dizol Liquide Vaisselle 450ml", size: "450 ml", price: "160", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/07/1000012235-1.jpg" },
  { categorySlug: "produits-entretien", nameFr: "Dizol Liquide Vaisselle 650ml", size: "650 ml", price: "220", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/07/1000012235.jpg" },
  { categorySlug: "produits-entretien", nameFr: "Aigle Liquide Linge A Main 1L", size: "1 L", price: "300", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/07/1000012232.jpg" },
  { categorySlug: "produits-entretien", nameFr: "Aigle Lessive 1L", size: "1 L", price: "340", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/07/1000012229.jpg" },
  { categorySlug: "produits-entretien", nameFr: "Aigle Lessive en Poudre 2.5kg", size: "2.5 kg", price: "720", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/07/1000012223.jpg" },
  { categorySlug: "produits-entretien", nameFr: "Aigle Savon Liquide 400ml", size: "400 ml", price: "135", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/07/1000012064.jpg" },
  { categorySlug: "produits-entretien", nameFr: "Aigle Top Sani 850ml", size: "850 ml", price: "95", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/07/1000012061.jpg" },
  { categorySlug: "produits-entretien", nameFr: "Aigle Top Sols 1L", size: "1 L", price: "120", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/07/1000012066.jpg" },
  { categorySlug: "produits-entretien", nameFr: "Aigle Decapfour 500ml", size: "500 ml", price: "170", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/07/1000012107.jpg" },
  { categorySlug: "produits-entretien", nameFr: "Aigle Multi Surfaces 1L", size: "1 L", price: "200", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/07/1000012054.jpg" },
  { categorySlug: "produits-entretien", nameFr: "Aigle Liquide Vaisselle 970ml", size: "970 ml", price: "280", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/07/1000012053-2.jpg" },
  { categorySlug: "produits-entretien", nameFr: "Aigle Gel Detartrant Lavande 750ml", size: "750 ml", price: "250", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/07/1000012058.jpg" },
  { categorySlug: "produits-entretien", nameFr: "Aigle Gel Javel 700ml", size: "700 ml", price: "190", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/07/1000012057.jpg" },
  { categorySlug: "produits-entretien", nameFr: "Wave Lave Sol 1L", size: "1 L", price: "220", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/07/1000012059.jpg" },
  { categorySlug: "produits-entretien", nameFr: "Aigle Javel 900ml", size: "900 ml", price: "95", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/07/1000012062.jpg" },
  // ---------- Produits pour la Maison (20) ----------
  { categorySlug: "produits-maison", nameFr: "Ambi Sens Desodorisant", size: "300 ml", price: "300", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/07/1000011439.jpg" },
  { categorySlug: "produits-maison", nameFr: "Speed Fire Desodorisant 460ml", size: "460 ml", price: "280", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/07/Design-sans-titre-80-1.webp" },
  { categorySlug: "produits-maison", nameFr: "Ambition Desodorisant 750ml", size: "750 ml", price: "250", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_7080.jpg" },
  { categorySlug: "produits-maison", nameFr: "Lorage Desodorisant 750ml", size: "750 ml", price: "250", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_7079.jpg" },
  { categorySlug: "produits-maison", nameFr: "Lorage Bien-Etre Happiness 250ml", size: "250 ml", price: "300", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_7086.jpg" },
  { categorySlug: "produits-maison", nameFr: "Lorage Deso 300ml", size: "300 ml", price: "130", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_7083.jpg" },
  { categorySlug: "produits-maison", nameFr: "Brilex Fresh Garden Vapo 400ml", size: "400 ml", price: "180", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_7082.jpg" },
  { categorySlug: "produits-maison", nameFr: "Force Xpress Oriental 500ml", size: "500 ml", price: "270", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_7074.jpg" },
  { categorySlug: "produits-maison", nameFr: "Palc Desodorisant 600ml", size: "600 ml", price: "220", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_7064.jpg" },
  { categorySlug: "produits-maison", nameFr: "Odoris Desodorisant 400ml", size: "400 ml", price: "220", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_7059.jpg" },
  { categorySlug: "produits-maison", nameFr: "Cotex Fraicheur 50m", size: "50 m", price: "300", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/06/1000010869.jpg" },
  { categorySlug: "produits-maison", nameFr: "Cotex Essuie-Tout 2x", size: "X2", price: "130", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_6450.png" },
  { categorySlug: "produits-maison", nameFr: "Sacs Poubelles 130L", size: "130 L", price: "420", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_6456.png" },
  { categorySlug: "produits-maison", nameFr: "Sac Poubelle 60L", size: "60 L", price: "200", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_6453.png" },
  { categorySlug: "produits-maison", nameFr: "Fabro Rouleau Essuie-Tout", size: "1 rouleau", price: "350", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_6466.png" },
  { categorySlug: "produits-maison", nameFr: "Koroplast Sac de Congelation Reutilisable", size: "15 pcs", price: "220", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_6474.png" },
  { categorySlug: "produits-maison", nameFr: "Wafa Essuie-Tout 2 Rlx", size: "2 Rlx", price: "195", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_6448.png" },
  { categorySlug: "produits-maison", nameFr: "COTEX FILM 10M", size: "10 m", price: "75", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_6491.png" },
  { categorySlug: "produits-maison", nameFr: "WAFA PAPIER CUISSON 5M", size: "5 m", price: "90", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_6489.png" },
  { categorySlug: "produits-maison", nameFr: "COTEX ALUMINIUM 10M", size: "10 m", price: "175", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_6486.png" },
  // ---------- Produits pour Bébé (20) ----------
  { categorySlug: "produits-bebe", nameFr: "Bimbies Splash 6", size: "10 pièces", price: "360", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/07/1000012259-3.jpg" },
  { categorySlug: "produits-bebe", nameFr: "Bimbies Splash 5", size: "8 pièces", price: "310", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/07/1000012259-1.jpg" },
  { categorySlug: "produits-bebe", nameFr: "Good Care couche taille 4", size: "54 pièces", price: "920", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/01/1000228684.jpg" },
  { categorySlug: "produits-bebe", nameFr: "Hopla compote", size: "1 pièce", price: "220", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/12/1000216285.jpg" },
  { categorySlug: "produits-bebe", nameFr: "Hopla compote sans sucre", size: "1 pièce", price: "220", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/12/1000216286.jpg" },
  { categorySlug: "produits-bebe", nameFr: "Compy duo pack", size: "1 pack", price: "380", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/12/1000002368.jpg" },
  { categorySlug: "produits-bebe", nameFr: "Ovi One lingettes", size: "64 pièces", price: "300", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/06/17.webp" },
  { categorySlug: "produits-bebe", nameFr: "Ayam coton disque bébé", size: "60 pièces", price: "280", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/06/18.webp" },
  { categorySlug: "produits-bebe", nameFr: "The Best crème de change", size: "75 ml", price: "300", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/06/Untitled-design-70.webp" },
  { categorySlug: "produits-bebe", nameFr: "The Best talc", size: "200 g", price: "240", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/06/Untitled-design-58-1.webp" },
  { categorySlug: "produits-bebe", nameFr: "The Best shampooing / gel douche", size: "400 ml", price: "250", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/06/Untitled-design-54-1.webp" },
  { categorySlug: "produits-bebe", nameFr: "The Best lait bébé", size: "400 ml", price: "600", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/06/Untitled-design-56.webp" },
  { categorySlug: "produits-bebe", nameFr: "BB Cool 3", size: "80 pièces", price: "1700", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/06/Untitled-design-51.webp" },
  { categorySlug: "produits-bebe", nameFr: "BB Cool 5", size: "80 pièces", price: "2150", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/06/Untitled-design-50.webp" },
  { categorySlug: "produits-bebe", nameFr: "Molfix 5", size: "88 pièces", price: "2100", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/06/Untitled-design-43.webp" },
  { categorySlug: "produits-bebe", nameFr: "Molfix 4", size: "88 pièces", price: "1850", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/06/Untitled-design-47.webp" },
  { categorySlug: "produits-bebe", nameFr: "Bimbies 6", size: "68 pièces", price: "2050", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/Design-sans-titre-42-scaled.png" },
  { categorySlug: "produits-bebe", nameFr: "Bimbies 5", size: "78 pièces", price: "2050", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/image_123923953__43_-removebg-preview-min.png" },
  { categorySlug: "produits-bebe", nameFr: "Bimbies 4", size: "80 pièces", price: "1950", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/4_pack_ultra_eco-removebg-preview-min.png" },
  { categorySlug: "produits-bebe", nameFr: "Natura Pro huile bébé", size: "200 ml", price: "320", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/06/19.webp" },
  // ---------- Céréales & Petit Déjeuner (20) ----------
  { categorySlug: "cereales-petit-dejeuner", nameFr: "Choco Obei chocolat en poudre", size: "500 g", price: "360", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/09/1000311661.jpg" },
  { categorySlug: "cereales-petit-dejeuner", nameFr: "Nestlé Crunch", size: "675 g", price: "2300", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/09/1000014262.jpg" },
  { categorySlug: "cereales-petit-dejeuner", nameFr: "Nestlé Kellogg's Frosties", size: "620 g", price: "1850", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/09/1000014261.jpg" },
  { categorySlug: "cereales-petit-dejeuner", nameFr: "Twisco chocolat poudre", size: "900 g", price: "640", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/06/1000010887.jpg" },
  { categorySlug: "cereales-petit-dejeuner", nameFr: "Chocosol pâte à tartiner pistache", size: "700 g", price: "1200", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/06/1000009346.jpg" },
  { categorySlug: "cereales-petit-dejeuner", nameFr: "Chocosol pâte à tartiner", size: "340 g", price: "280", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/06/1000009345.jpg" },
  { categorySlug: "cereales-petit-dejeuner", nameFr: "Amiral Moon pâte à tartiner", size: "700 g", price: "900", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/06/1000009332.jpg" },
  { categorySlug: "cereales-petit-dejeuner", nameFr: "Takelait biscotte 6 céréales", size: "500 g", price: "290", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/11/1000001268.jpg" },
  { categorySlug: "cereales-petit-dejeuner", nameFr: "Takelait biscotte à l'avoine", size: "500 g", price: "260", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/11/1000001263.jpg" },
  { categorySlug: "cereales-petit-dejeuner", nameFr: "Kellogg's Corn Flakes", size: "375 g", price: "990", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/10/1000178073.jpg" },
  { categorySlug: "cereales-petit-dejeuner", nameFr: "Kellogg's Krave", size: "410 g", price: "1990", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/10/1000178075.jpg" },
  { categorySlug: "cereales-petit-dejeuner", nameFr: "Nestlé Kit Kat céréales", size: "330 g", price: "1900", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/07/NESTLE-KIT-KAT-CEREALES-330G.png" },
  { categorySlug: "cereales-petit-dejeuner", nameFr: "Nestlé Lion cereal", size: "550 g", price: "1850", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/07/Lion-Triple-Crunchy.png-1.webp" },
  { categorySlug: "cereales-petit-dejeuner", nameFr: "Nesquik recharge", size: "350 g", price: "600", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/09/1000173375.jpg" },
  { categorySlug: "cereales-petit-dejeuner", nameFr: "Granior flocons d'avoine", size: "500 g", price: "250", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7534.jpg" },
  { categorySlug: "cereales-petit-dejeuner", nameFr: "Takelait flocons d'avoine", size: "1 kg", price: "430", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7495.jpg" },
  { categorySlug: "cereales-petit-dejeuner", nameFr: "Cœur de Céréale flocons d'avoine", size: "1 kg", price: "450", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7496.jpg" },
  { categorySlug: "cereales-petit-dejeuner", nameFr: "Nutella", size: "1 kg", price: "3200", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/09/1000175239.jpg" },
  { categorySlug: "cereales-petit-dejeuner", nameFr: "Cherchell Pops céréales", size: "1 pièce", price: "200", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/12/1000002700.jpg" },
  { categorySlug: "cereales-petit-dejeuner", nameFr: "Takelait muesli", size: "250 g", price: "360", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7519.jpg" },
  // ---------- Conserves & Sauces (20) ----------
  { categorySlug: "conserves-sauces", nameFr: "Mont d'Or champignons entier", size: "280 g", price: "300", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/09/1000311112.jpg" },
  { categorySlug: "conserves-sauces", nameFr: "Jnany tomate cerise", size: "350 g", price: "250", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/06/1000010914.jpg" },
  { categorySlug: "conserves-sauces", nameFr: "Afia thon au naturel", size: "1 pièce", price: "320", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/06/1000009324.jpg" },
  { categorySlug: "conserves-sauces", nameFr: "La Petite Ferme champignons", size: "400 g", price: "230", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/06/1000009276.jpg" },
  { categorySlug: "conserves-sauces", nameFr: "La Petite Ferme pois chiches", size: "580 g", price: "150", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/06/1000009279.jpg" },
  { categorySlug: "conserves-sauces", nameFr: "Bono tomate concentrée 800g", size: "800 g", price: "320", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/12/1000216281-1.jpg" },
  { categorySlug: "conserves-sauces", nameFr: "Bono tomate concentrée 380g", size: "380 g", price: "180", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/12/1000216281.jpg" },
  { categorySlug: "conserves-sauces", nameFr: "Badira tomates concentré", size: "380 g", price: "130", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/11/1000000266.jpg" },
  { categorySlug: "conserves-sauces", nameFr: "Ela tomate", size: "760 g", price: "190", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_7475.png" },
  { categorySlug: "conserves-sauces", nameFr: "Sipa tomates concentrées", size: "800 g", price: "240", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_7477.png" },
  { categorySlug: "conserves-sauces", nameFr: "Thika maïs", size: "230 g", price: "200", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7380.jpg" },
  { categorySlug: "conserves-sauces", nameFr: "Bono maïs doux", size: "400 g", price: "220", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7382.jpg" },
  { categorySlug: "conserves-sauces", nameFr: "Viter haricots verts", size: "600 g", price: "350", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7386.jpg" },
  { categorySlug: "conserves-sauces", nameFr: "Mont d'Or ketchup", size: "510 g", price: "190", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/09/1000311109-1.jpg" },
  { categorySlug: "conserves-sauces", nameFr: "Noor ketchup", size: "510 g", price: "220", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/06/1000009316.jpg" },
  { categorySlug: "conserves-sauces", nameFr: "Heinz mayo American Style", size: "220 ml", price: "800", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/05/1000007749.jpg" },
  { categorySlug: "conserves-sauces", nameFr: "Tabasco", size: "59 ml", price: "1200", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/08/1000013817.jpg" },
  { categorySlug: "conserves-sauces", nameFr: "Fleurial mayonnaise", size: "450 g", price: "300", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_6534.png" },
  { categorySlug: "conserves-sauces", nameFr: "Cevital sauce algérienne", size: "850 g", price: "320", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/01/IMG_6522.png" },
  { categorySlug: "conserves-sauces", nameFr: "Sicam harissa", size: "135 g", price: "250", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/02/1000239485.jpg" },
  // ---------- Fruits & Légumes (17 — shortfall 3, see header note) ----------
  { categorySlug: "fruits-legumes", nameFr: "Pomme par poids", size: "1 kg", price: "1600", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/02/1000005684.jpg", isAvailable: false },
  { categorySlug: "fruits-legumes", nameFr: "Kiwi poids", size: "1 kg", price: "2100", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/11/1000206934.jpg", isAvailable: false },
  { categorySlug: "fruits-legumes", nameFr: "Zfizaf (jujube)", size: "1 kg", price: "2000", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/09/1000174223.jpg", isAvailable: false },
  { categorySlug: "fruits-legumes", nameFr: "Ananas poids", size: "1 pièce", price: "1700", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/08/%D8%B1%D8%B1%D8%B1.png" },
  { categorySlug: "fruits-legumes", nameFr: "Avocat", size: "1 pièce", price: "1900", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/06/a-1.webp", isAvailable: false },
  { categorySlug: "fruits-legumes", nameFr: "Olive cocktail", size: "1 pièce", price: "600", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/06/Olives-cocktail-exotique-TERRIA-grossiste-alimentaire-detail.webp" },
  { categorySlug: "fruits-legumes", nameFr: "Olive noir", size: "1 pièce", price: "500", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/06/a-5.webp" },
  { categorySlug: "fruits-legumes", nameFr: "Olive Mtamar fait maison", size: "1 pièce", price: "800", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/OLIVE_MTAMER_FAIT_MAISON_BY.webp" },
  { categorySlug: "fruits-legumes", nameFr: "Olive vert gros", size: "1 pièce", price: "900", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/OLIVE_VERT_GROS_EGYPTE_rE8aTPT.webp" },
  { categorySlug: "fruits-legumes", nameFr: "Olive grillé", size: "1 pièce", price: "800", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/coffee-11.png" },
  { categorySlug: "fruits-legumes", nameFr: "Olive vert", size: "1 pièce", price: "650", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/coffee-10.png" },
  { categorySlug: "fruits-legumes", nameFr: "Olive violet", size: "1 pièce", price: "600", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/coffee-9.png" },
  { categorySlug: "fruits-legumes", nameFr: "Olive vert tranche", size: "1 pièce", price: "650", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/coffee-8.png" },
  { categorySlug: "fruits-legumes", nameFr: "Thika olives grillées", size: "300 g", price: "200", imageUrl: "https://familymarket13.com/wp-content/uploads/2026/02/1000005434-3.png" },
  { categorySlug: "fruits-legumes", nameFr: "Cornichon", size: "1 pièce", price: "1400", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/coffee-7.png" },
  { categorySlug: "fruits-legumes", nameFr: "Champignon en tranche", size: "1 pièce", price: "1500", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/CHAMPIGNON.webp" },
  { categorySlug: "fruits-legumes", nameFr: "Food Royale haricots congelés", size: "400 g", price: "200", imageUrl: "https://familymarket13.com/wp-content/uploads/2025/02/IMG_7429-1.jpg" },
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
          headers: { "User-Agent": "FamilyMarketImport/1.0" },
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

  // Duplicate detection: by slug AND by normalized (nameFr + size).
  // Existing products are never modified — matches are skipped.
  const existingProducts = await prisma.product.findMany({
    select: { slug: true, nameFr: true, size: true },
  });
  const existingBySlug = new Map(existingProducts.map((p) => [p.slug, p]));
  const existingByNameSize = new Set(
    existingProducts.map((p) => `${norm(p.nameFr)}|${norm(p.size)}`),
  );

  const mediaNames = slugs.map((slug) => `family-market-${slug}`);
  const existingMedia = await prisma.mediaAsset.findMany({
    where: { name: { in: mediaNames } },
    select: { id: true, name: true, url: true, mimeType: true },
  });
  const mediaByName = new Map(existingMedia.map((m) => [m.name, m]));

  let created = 0;
  let mediaUploaded = 0;
  let mediaReused = 0;
  let withoutImage = 0;
  let withoutBarcode = 0;
  let withoutArabic = 0;
  const createdProductIds: string[] = [];
  const createdMediaIds: string[] = [];
  const skipped: string[] = [];
  const perCategory: Record<string, number> = {};
  const report: {
    nameFr: string;
    category: string;
    size: string;
    price: string;
    isAvailable: boolean;
    imageDownloaded: boolean;
    imageFile: string | null;
  }[] = [];

  for (let index = 0; index < ITEMS.length; index += 1) {
    const item = ITEMS[index];
    const slug = slugs[index];
    const mediaName = `family-market-${slug}`;
    const isAvailable = item.isAvailable !== false;

    const already =
      existingBySlug.get(slug) ??
      (existingByNameSize.has(`${norm(item.nameFr)}|${norm(item.size)}`) ? { slug } : undefined);
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
        const media = await prisma.mediaAsset.create({
          data: {
            name: mediaName,
            url: blob.url,
            type: "image",
            mimeType,
            size: bytes.length,
            category: "PRODUCT",
            altFr: item.nameFr,
            altAr: null,
          },
        });
        mediaByName.set(mediaName, { id: media.id, name: mediaName, url: blob.url, mimeType });
        createdMediaIds.push(media.id);
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
    withoutBarcode += 1; // source provides no barcodes in this batch
    withoutArabic += 1; // source provides no Arabic names in this batch

    const createdProduct = await prisma.product.create({
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
        isAvailable,
        categoryId: categoryBySlug.get(item.categorySlug)!.id,
      },
    });
    created += 1;
    createdProductIds.push(createdProduct.id);
    perCategory[item.categorySlug] = (perCategory[item.categorySlug] ?? 0) + 1;
    existingBySlug.set(slug, createdProduct);
    existingByNameSize.add(`${norm(item.nameFr)}|${norm(item.size)}`);
    console.log(
      `+ ${slug} · ${item.nameFr} · ${item.size} · ${item.price} DA · ${isAvailable ? "dispo" : "indispo"} · image=${imageDownloaded ? imageFile : "non"}`,
    );
    report.push({
      nameFr: item.nameFr,
      category: item.categorySlug,
      size: item.size,
      price: item.price,
      isAvailable,
      imageDownloaded,
      imageFile,
    });
  }

  const productsAfter = await prisma.product.count();
  await prisma.$disconnect();

  writeFileSync(
    "C:/Users/ABDELK~1/AppData/Local/Temp/opencode/fm13-batch2-report.json",
    JSON.stringify(
      {
        productsBefore,
        productsAfter,
        created,
        mediaUploaded,
        mediaReused,
        withoutImage,
        withoutBarcode,
        withoutArabic,
        skipped,
        perCategory,
        createdProductIds,
        createdMediaIds,
        report,
      },
      null,
      1,
    ),
  );

  console.log(`\nTerminé : ${created} produit(s) créé(s) (${productsBefore} → ${productsAfter}).`);
  console.log(`Médias : ${mediaUploaded} upload(s), ${mediaReused} réutilisé(s), ${withoutImage} produit(s) sans image.`);
  console.log(`Par catégorie : ${JSON.stringify(perCategory)}`);
  if (skipped.length > 0) {
    console.log(`Ignorés (déjà présents, aucun écrasement) — ${skipped.length} :`);
    console.log(skipped.map((entry) => `- ${entry}`).join("\n"));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
