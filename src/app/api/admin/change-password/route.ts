import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/dal";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  let body: {
    currentPassword?: unknown;
    newPassword?: unknown;
    confirmPassword?: unknown;
  };
  try {
    body = (await request.json()) as {
      currentPassword?: unknown;
      newPassword?: unknown;
      confirmPassword?: unknown;
    };
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const currentPassword =
    typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword =
    typeof body.newPassword === "string" ? body.newPassword : "";
  const confirmPassword =
    typeof body.confirmPassword === "string" ? body.confirmPassword : "";

  if (!currentPassword) {
    return NextResponse.json(
      { error: "Mot de passe actuel requis." },
      { status: 400 },
    );
  }
  if (!newPassword) {
    return NextResponse.json(
      { error: "Nouveau mot de passe requis." },
      { status: 400 },
    );
  }
  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "Le nouveau mot de passe doit contenir au moins 8 caractères." },
      { status: 400 },
    );
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { error: "Les mots de passe ne correspondent pas." },
      { status: 400 },
    );
  }

  try {
    const admin = await db.adminUser.findUnique({
      where: { id: session.id },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Compte administrateur introuvable." },
        { status: 404 },
      );
    }

    const valid = await verifyPassword(admin.passwordHash, currentPassword);
    if (!valid) {
      return NextResponse.json(
        { error: "Mot de passe actuel incorrect." },
        { status: 401 },
      );
    }

    const newHash = await hashPassword(newPassword);
    await db.adminUser.update({
      where: { id: admin.id },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Échec du changement de mot de passe :", error);
    return NextResponse.json(
      { error: "Une erreur interne est survenue." },
      { status: 500 },
    );
  }
}
