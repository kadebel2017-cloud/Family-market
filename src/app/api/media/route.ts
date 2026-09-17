import { NextResponse } from "next/server";

import { verifySessionToken, getSessionToken } from "@/lib/auth/session";
import { listMediaSummaries } from "@/lib/admin/queries";

export async function GET() {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json(
      { error: "Authentification requise." },
      { status: 401 },
    );
  }
  const session = await verifySessionToken(token);
  if (!session) {
    return NextResponse.json(
      { error: "Authentification requise." },
      { status: 401 },
    );
  }

  try {
    const media = await listMediaSummaries();
    return NextResponse.json({ media });
  } catch (error) {
    console.error("[api] liste des médias", error);
    return NextResponse.json(
      { error: "Impossible de charger les médias." },
      { status: 500 },
    );
  }
}