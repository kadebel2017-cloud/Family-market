export const SESSION_COOKIE_NAME = "session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET is not set. Add it to the environment (see .env.example).",
    );
  }
  return new TextEncoder().encode(secret);
}