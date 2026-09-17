import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@/generated/prisma/client";

// Reference catalog for development only. Prices are indicative values the
// shop owner must review in the admin (source of truth) — no real prices,
// no images, no sale prices here. Script is idempotent: existing products
// (matched by slug) are never overwritten.
interface StarterProduct {
  categorySlug: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  size: string;
  price: string;
}

const STARTER_PRODUCTS: StarterProduct[] = [
  // Fruits & légumes
  { categorySlug: "fruits-legumes", slug: "pomme-de-terre-1kg", nameFr: "Pomme de terre", nameAr: "بطاطا", size: "1 kg", price: "130" },
  { categorySlug: "fruits-legumes", slug: "tomate-1kg", nameFr: "Tomate", nameAr: "طماطم", size: "1 kg", price: "130" },
  { categorySlug: "fruits-legumes", slug: "oignon-1kg", nameFr: "Oignon", nameAr: "بصل", size: "1 kg", price: "100" },
  { categorySlug: "fruits-legumes", slug: "carotte-1kg", nameFr: "Carotte", nameAr: "جزر", size: "1 kg", price: "100" },
  { categorySlug: "fruits-legumes", slug: "banane-1kg", nameFr: "Banane", nameAr: "موز", size: "1 kg", price: "400" },
  // Boissons
  { categorySlug: "boissons", slug: "coca-cola-33cl", nameFr: "Coca-Cola", nameAr: "كوكا كولا", size: "33 cl", price: "70" },
  { categorySlug: "boissons", slug: "pepsi-33cl", nameFr: "Pepsi", nameAr: "بيبسي", size: "33 cl", price: "70" },
  { categorySlug: "boissons", slug: "fanta-orange-33cl", nameFr: "Fanta Orange", nameAr: "فانتا برتقال", size: "33 cl", price: "70" },
  { categorySlug: "boissons", slug: "hamoud-boualem-33cl", nameFr: "Hamoud Boualem", nameAr: "حمود بوعلام", size: "33 cl", price: "70" },
  { categorySlug: "boissons", slug: "eau-minerale-1-5l", nameFr: "Eau minérale", nameAr: "ماء معدني", size: "1,5 L", price: "50" },
  // Produits laitiers
  { categorySlug: "produits-laitiers", slug: "lait-uht-1l", nameFr: "Lait UHT", nameAr: "حليب معقم", size: "1 L", price: "140" },
  { categorySlug: "produits-laitiers", slug: "lben-1l", nameFr: "Lben", nameAr: "لبن", size: "1 L", price: "160" },
  { categorySlug: "produits-laitiers", slug: "yaourt-nature-100g", nameFr: "Yaourt nature", nameAr: "ياغورت طبيعي", size: "100 g", price: "40" },
  { categorySlug: "produits-laitiers", slug: "fromage-fondu-8-portions", nameFr: "Fromage fondu", nameAr: "جبن مذاب", size: "8 portions", price: "180" },
  { categorySlug: "produits-laitiers", slug: "margarine-250g", nameFr: "Margarine", nameAr: "مارغرين", size: "250 g", price: "120" },
  // Épicerie
  { categorySlug: "epicerie", slug: "riz-1kg", nameFr: "Riz", nameAr: "أرز", size: "1 kg", price: "180" },
  { categorySlug: "epicerie", slug: "sucre-blanc-1kg", nameFr: "Sucre blanc", nameAr: "سكر أبيض", size: "1 kg", price: "95" },
  { categorySlug: "epicerie", slug: "huile-vegetale-1l", nameFr: "Huile végétale", nameAr: "زيت نباتي", size: "1 L", price: "650" },
  { categorySlug: "epicerie", slug: "pates-500g", nameFr: "Pâtes alimentaires", nameAr: "معكرونة", size: "500 g", price: "90" },
  { categorySlug: "epicerie", slug: "farine-1kg", nameFr: "Farine", nameAr: "فرينة", size: "1 kg", price: "90" },
  // Surgelés
  { categorySlug: "surgeles", slug: "frites-surgeles-1kg", nameFr: "Frites surgelées", nameAr: "بطاطا مقلية مجمدة", size: "1 kg", price: "350" },
  { categorySlug: "surgeles", slug: "petits-pois-1kg", nameFr: "Petits pois", nameAr: "جلبانة", size: "1 kg", price: "300" },
  { categorySlug: "surgeles", slug: "melange-legumes-1kg", nameFr: "Mélange de légumes", nameAr: "خليط الخضار", size: "1 kg", price: "350" },
  { categorySlug: "surgeles", slug: "nuggets-poulet-500g", nameFr: "Nuggets de poulet", nameAr: "ناغتس الدجاج", size: "500 g", price: "500" },
  { categorySlug: "surgeles", slug: "poisson-pane-500g", nameFr: "Poisson pané", nameAr: "سمك بانيه", size: "500 g", price: "550" },
  // Biscuits & confiseries
  { categorySlug: "biscuits-confiseries", slug: "bimo-4-choco-100g", nameFr: "BIMO 4 Choco", nameAr: "بيمو 4 شوكو", size: "100 g", price: "72" },
  { categorySlug: "biscuits-confiseries", slug: "goldy-190g", nameFr: "Goldy", nameAr: "غولدي", size: "190 g", price: "110" },
  { categorySlug: "biscuits-confiseries", slug: "zanimaux-80g", nameFr: "Z'Animaux", nameAr: "حيوانات", size: "80 g", price: "28" },
  { categorySlug: "biscuits-confiseries", slug: "cookies-200g", nameFr: "Cookies", nameAr: "كوكيز", size: "200 g", price: "127" },
  { categorySlug: "biscuits-confiseries", slug: "gaufrette-mini-best-of-190g", nameFr: "Gaufrette Mini Best Of", nameAr: "وافل ميني بست أوف", size: "190 g", price: "138" },
  // Hygiène & beauté
  { categorySlug: "hygiene-beaute", slug: "savon-de-toilette-100g", nameFr: "Savon de toilette", nameAr: "صابون التواليت", size: "100 g", price: "80" },
  { categorySlug: "hygiene-beaute", slug: "shampooing-250ml", nameFr: "Shampooing", nameAr: "شامبو", size: "250 ml", price: "250" },
  { categorySlug: "hygiene-beaute", slug: "dentifrice-75ml", nameFr: "Dentifrice", nameAr: "معجون أسنان", size: "75 ml", price: "180" },
  { categorySlug: "hygiene-beaute", slug: "brosse-a-dents-1-piece", nameFr: "Brosse à dents", nameAr: "فرشاة أسنان", size: "1 pièce", price: "120" },
  { categorySlug: "hygiene-beaute", slug: "gel-douche-250ml", nameFr: "Gel douche", nameAr: "جل الاستحمام", size: "250 ml", price: "250" },
  // Produits d'entretien
  { categorySlug: "produits-entretien", slug: "eau-de-javel-1l", nameFr: "Eau de Javel", nameAr: "ماء جافيل", size: "1 L", price: "100" },
  { categorySlug: "produits-entretien", slug: "liquide-vaisselle-750ml", nameFr: "Liquide vaisselle", nameAr: "سائل الغسيل", size: "750 ml", price: "180" },
  { categorySlug: "produits-entretien", slug: "lessive-2kg", nameFr: "Lessive", nameAr: "مسحوق الغسيل", size: "2 kg", price: "450" },
  { categorySlug: "produits-entretien", slug: "nettoyant-multi-surfaces-750ml", nameFr: "Nettoyant multi-surfaces", nameAr: "منظف متعدد الأسطح", size: "750 ml", price: "220" },
  { categorySlug: "produits-entretien", slug: "desodorisant-maison-300ml", nameFr: "Désodorisant maison", nameAr: "معطر الجو", size: "300 ml", price: "250" },
  // Produits de maison
  { categorySlug: "produits-maison", slug: "papier-aluminium-1-rouleau", nameFr: "Papier aluminium", nameAr: "ورق ألمنيوم", size: "1 rouleau", price: "180" },
  { categorySlug: "produits-maison", slug: "film-alimentaire-1-rouleau", nameFr: "Film alimentaire", nameAr: "فيلم غذائي", size: "1 rouleau", price: "150" },
  { categorySlug: "produits-maison", slug: "sacs-poubelle-20-sacs", nameFr: "Sacs poubelle", nameAr: "أكياس قمامة", size: "20 sacs", price: "150" },
  { categorySlug: "produits-maison", slug: "eponge-cuisine-3-pieces", nameFr: "Éponge de cuisine", nameAr: "إسفنجة المطبخ", size: "3 pièces", price: "100" },
  { categorySlug: "produits-maison", slug: "essuie-tout-2-rouleaux", nameFr: "Essuie-tout", nameAr: "مناديل المطبخ", size: "2 rouleaux", price: "180" },
  // Produits bébé
  { categorySlug: "produits-bebe", slug: "couches-bebe-taille-3", nameFr: "Couches bébé", nameAr: "حفاظات الأطفال", size: "Taille 3", price: "700" },
  { categorySlug: "produits-bebe", slug: "lingettes-bebe-72-pieces", nameFr: "Lingettes bébé", nameAr: "مناديل مبللة", size: "72 pièces", price: "180" },
  { categorySlug: "produits-bebe", slug: "shampooing-bebe-250ml", nameFr: "Shampooing bébé", nameAr: "شامبو أطفال", size: "250 ml", price: "250" },
  { categorySlug: "produits-bebe", slug: "savon-bebe-100g", nameFr: "Savon bébé", nameAr: "صابون أطفال", size: "100 g", price: "120" },
  { categorySlug: "produits-bebe", slug: "creme-bebe-100ml", nameFr: "Crème bébé", nameAr: "كريم أطفال", size: "100 ml", price: "300" },
  // Céréales & petit-déjeuner
  { categorySlug: "cereales-petit-dejeuner", slug: "cereales-chocolat-375g", nameFr: "Céréales chocolat", nameAr: "كورن فليكس بالشوكولاتة", size: "375 g", price: "350" },
  { categorySlug: "cereales-petit-dejeuner", slug: "flocons-avoine-500g", nameFr: "Flocons d'avoine", nameAr: "شوفان", size: "500 g", price: "250" },
  { categorySlug: "cereales-petit-dejeuner", slug: "miel-250g", nameFr: "Miel", nameAr: "عسل", size: "250 g", price: "450" },
  { categorySlug: "cereales-petit-dejeuner", slug: "confiture-dabricot-370g", nameFr: "Confiture d'abricot", nameAr: "مربى المشمش", size: "370 g", price: "300" },
  { categorySlug: "cereales-petit-dejeuner", slug: "pate-a-tartiner-chocolat-400g", nameFr: "Pâte à tartiner chocolat", nameAr: "شوكولاتة قابلة للدهن", size: "400 g", price: "500" },
  // Conserves & sauces
  { categorySlug: "conserves-sauces", slug: "concentre-tomate-800g", nameFr: "Concentré de tomate", nameAr: "معجون الطماطم", size: "800 g", price: "250" },
  { categorySlug: "conserves-sauces", slug: "thon-en-conserve-160g", nameFr: "Thon en conserve", nameAr: "تونة معلبة", size: "160 g", price: "300" },
  { categorySlug: "conserves-sauces", slug: "mayonnaise-500ml", nameFr: "Mayonnaise", nameAr: "مايونيز", size: "500 ml", price: "250" },
  { categorySlug: "conserves-sauces", slug: "ketchup-500ml", nameFr: "Ketchup", nameAr: "كاتشب", size: "500 ml", price: "220" },
  { categorySlug: "conserves-sauces", slug: "harissa-135g", nameFr: "Harissa", nameAr: "هريسة", size: "135 g", price: "150" },
];

async function main(): Promise<void> {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const categories = await prisma.category.findMany({
    select: { id: true, slug: true },
  });
  const categoryIds = new Map(categories.map((category) => [category.slug, category.id]));
  const missingCategories = [
    ...new Set(STARTER_PRODUCTS.map((product) => product.categorySlug)),
  ].filter((slug) => !categoryIds.has(slug));
  if (missingCategories.length > 0) {
    console.error(`Catégories introuvables : ${missingCategories.join(", ")}`);
    await prisma.$disconnect();
    process.exit(1);
  }

  const existingRows = await prisma.product.findMany({
    where: { slug: { in: STARTER_PRODUCTS.map((product) => product.slug) } },
    select: { slug: true },
  });
  const existingSlugs = new Set(existingRows.map((row) => row.slug));

  let created = 0;
  const skipped: string[] = [];

  for (const product of STARTER_PRODUCTS) {
    if (existingSlugs.has(product.slug)) {
      skipped.push(`${product.slug} · ${product.nameFr}`);
      continue;
    }
    await prisma.product.create({
      data: {
        nameFr: product.nameFr,
        nameAr: product.nameAr,
        slug: product.slug,
        size: product.size,
        price: new Prisma.Decimal(product.price),
        isAvailable: true,
        categoryId: categoryIds.get(product.categorySlug)!,
      },
    });
    created += 1;
    console.log(
      `+ ${product.slug} · ${product.nameFr} · ${product.size} · ${product.price} DA`,
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