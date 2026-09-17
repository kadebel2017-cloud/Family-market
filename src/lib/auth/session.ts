import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  getAuthSecret,
} from "./config";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

interface SessionTokenPayload {
  email: string;
  name: string;
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    email: user.email,
    name: user.name,
  } satisfies SessionTokenPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getAuthSecret());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    if (!payload.sub) {
      return null;
    }
    return {
      id: payload.sub,
      email: typeof payload.email === "string" ? payload.email : "",
      name: typeof payload.name === "string" ? payload.name : "",
    };
  } catch {
    return null;
  }
}

export async function getSessionToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value;
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}