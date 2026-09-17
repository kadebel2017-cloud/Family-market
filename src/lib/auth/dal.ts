import "server-only";

import { redirect } from "next/navigation";
import { getSessionToken, verifySessionToken, type SessionUser } from "./session";

export async function getSession(): Promise<SessionUser | null> {
  const token = await getSessionToken();
  if (!token) {
    return null;
  }
  return verifySessionToken(token);
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}