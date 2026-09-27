import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "@/generated/prisma/client";

// Starting delivery prices for Family Market — same values as Saada Shop.
// Only Oran (31) is seeded. Other wilayas are added later in
// Admin → Livraison; this script never touches products, categories,
// promotions or orders.
async function main(): Promise<void> {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.wilayaPrice.upsert({
      where: { wilayaCode: "31" },
      update: {},
      create: {
        wilayaCode: "31",
        wilayaName: "Oran",
        homePrice: new Prisma.Decimal(1000),
        officePrice: new Prisma.Decimal(600),
        isActive: true,
      },
    });
    // Free-delivery rule defaults (disabled — admin switches it ON).
    // Seuil 2000 DA, Oran / Sidi Chami / St Remy. All editable in admin.
    await prisma.freeDeliveryRule.upsert({
      where: { id: "default" },
      update: {},
      create: {
        id: "default",
        isEnabled: false,
        threshold: new Prisma.Decimal(2000),
        wilayaCode: "31",
        wilayaName: "Oran",
        commune: "Sidi Chami",
        district: "St Remy",
        bannerEnabled: false,
        bannerTextFr: "Livraison gratuite dès 2000 DA",
        bannerTextAr: "التوصيل مجاني ابتداءً من 2000 دج",
      },
    });
    const count = await prisma.wilayaPrice.count();
    console.log(`Delivery seed OK: ${count} wilaya price row(s).`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
