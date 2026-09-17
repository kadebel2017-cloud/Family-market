import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { AdminRole } from "@/generated/prisma/enums";
import { PrismaClient } from "@/generated/prisma/client";
import { hashPassword } from "@/lib/auth/password";

async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be set (see .env / .env.example).",
    );
    process.exit(1);
  }

  if (password.length < 12) {
    console.error("ADMIN_PASSWORD must be at least 12 characters long.");
    process.exit(1);
  }

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  const prisma = new PrismaClient({ adapter });

  const passwordHash = await hashPassword(password);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      email,
      passwordHash,
      name: email,
      role: AdminRole.ADMIN,
    },
  });

  await prisma.$disconnect();
  console.log(`Admin prêt : ${admin.email} (id=${admin.id})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});