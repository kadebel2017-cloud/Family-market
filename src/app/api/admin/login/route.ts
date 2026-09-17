import { NextResponse } from "next/server";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";

export async function POST(request: Request): Promise<NextResponse> {
  let body: { email?: unknown; password?: unknown };

  try {
    body = (await request.json()) as { email?: unknown; password?: unknown };
  } catch {
    return NextResponse.json(
      { error: "Requête invalide." },
      { status: 400 },
    );
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Adresse e-mail et mot de passe requis." },
      { status: 400 },
    );
  }

  try {
    const admin = await db.adminUser.findUnique({ where: { email } });

    if (!admin) {
      return NextResponse.json(
        { error: "Adresse e-mail ou mot de passe incorrect." },
        { status: 401 },
      );
    }

    const valid = await verifyPassword(admin.passwordHash, password);

    if (!valid) {
      return NextResponse.json(
        { error: "Adresse e-mail ou mot de passe incorrect." },
        { status: 401 },
      );
    }

    const token = await createSessionToken({
      id: admin.id,
      email: admin.email,
      name: admin.name,
    });
    await setSessionCookie(token);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Échec de la connexion admin :", error);
    return NextResponse.json(
      { error: "Une erreur interne est survenue." },
      { status: 500 },
    );
  }
}