import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@/generated/prisma/client";

// One-shot catalog addition: 4 Celena Color Protect products in
// "Hygiène & Beauté" (hygiene-beaute). 300 DA each.
// Script is idempotent: existing products (matched by slug) are never
// overwritten. No SKU: barcodes are unknown, slug is the unique key.
// Images: null until the owner attaches photos via /admin/products.
interface CelenaProduct {
  nameFr: string;
  nameAr: string;
  descriptionFr: string;
  descriptionAr: string;
  size: string;
  price: string;
  image: string | null;
}

// Slug: lowercase, no accents, words separated by dashes
// (same rule as src/lib/admin/format.ts slugify).
function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const CATEGORY_SLUG = "hygiene-beaute";

const CELENA_PRODUCTS: CelenaProduct[] = [
  {
    nameFr: "Shampooing Color Protect Celena Grenade 300ml",
    nameAr: "شامبو سيلينا لحماية الشعر المصبوغ بالرمان 300 مل",
    descriptionFr:
      "Shampooing sans sulfates spécialement conçu pour les cheveux colorés ou méchés. Protège la couleur, apporte de la brillance et aide à prolonger l'éclat des cheveux.",
    descriptionAr:
      "شامبو خالٍ من السلفات مخصص للشعر المصبوغ أو المملس، يساعد على حماية اللون والحفاظ على لمعان الشعر.",
    size: "300 ml",
    price: "300",
    image: null,
  },
  {
    nameFr: "Après-Shampooing Color Protect Celena Grenade 280ml",
    nameAr: "بلسم سيلينا لحماية الشعر المصبوغ بالرمان 280 مل",
    descriptionFr:
      "Après-shampooing nourrissant enrichi à l'extrait de grenade. Facilite le démêlage et protège les cheveux colorés.",
    descriptionAr:
      "بلسم مغذٍ بخلاصة الرمان يساعد على فك تشابك الشعر ويحافظ على لون الشعر المصبوغ.",
    size: "280 ml",
    price: "300",
    image: null,
  },
  {
    nameFr: "Gel Douche Celena Grenade Blend 300ml",
    nameAr: "جل استحمام سيلينا بالرمان 300 مل",
    descriptionFr:
      "Gel douche parfumé à la grenade. Nettoie la peau en douceur tout en laissant une sensation de fraîcheur et un parfum agréable.",
    descriptionAr:
      "جل استحمام برائحة الرمان ينظف البشرة بلطف ويمنح إحساساً بالانتعاش ورائحة مميزة.",
    size: "300 ml",
    price: "300",
    image: null,
  },
  {
    nameFr: "Masque Capillaire Color Protect Celena",
    nameAr: "ماسك سيلينا للشعر المصبوغ بالرمان",
    descriptionFr:
      "Masque capillaire réparateur pour cheveux colorés. Nourrit en profondeur, protège la couleur et améliore la douceur des cheveux.",
    descriptionAr:
      "ماسك مغذٍ للشعر المصبوغ يساعد على ترميم الشعر وحماية اللون ومنحه نعومة ولمعاناً أكبر.",
    size: "1 unité",
    price: "300",
    image: null,
  },
];

async function main(): Promise<void> {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const category = await prisma.category.findUnique({
    where: { slug: CATEGORY_SLUG },
    select: { id: true, isActive: true },
  });
  if (!category) {
    console.error(`Catégorie introuvable : ${CATEGORY_SLUG}`);
    await prisma.$disconnect();
    process.exit(1);
  }
  if (!category.isActive) {
    console.error(`Catégorie inactive : ${CATEGORY_SLUG}`);
    await prisma.$disconnect();
    process.exit(1);
  }

  const slugs = CELENA_PRODUCTS.map((product) => slugify(product.nameFr));
  const existingRows = await prisma.product.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true },
  });
  const existingSlugs = new Set(existingRows.map((row) => row.slug));

  let created = 0;
  const skipped: string[] = [];

  for (const product of CELENA_PRODUCTS) {
    const slug = slugify(product.nameFr);
    if (existingSlugs.has(slug)) {
      skipped.push(`${slug} · ${product.nameFr}`);
      continue;
    }
    await prisma.product.create({
      data: {
        nameFr: product.nameFr,
        nameAr: product.nameAr,
        slug,
        descriptionFr: product.descriptionFr,
        descriptionAr: product.descriptionAr,
        size: product.size,
        price: new Prisma.Decimal(product.price),
        image: product.image,
        isAvailable: true,
        categoryId: category.id,
      },
    });
    created += 1;
    console.log(
      `+ ${slug} · ${product.nameFr} · ${product.size} · ${product.price} DA`,
    );
  }

  await prisma.$disconnect();

  console.log(`\nTerminé : ${created} produit(s) créé(s).`);
  if (skipped.length > 0) {
    console.log(`Ignorés (déjà présents, aucun écrasement) — ${skipped.length} :`);
    console.log(skipped.map((entry) => `- ${entry}`).join("\n"));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
