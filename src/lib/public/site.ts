export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://family-market.vercel.app";

const PHONE_PATTERN = /^\+?[\d\s()\-.]{6,}$/;

const digitsOnly = (value: string): string => value.replace(/[^\d]/g, "");

const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

// Returns a safe http(s) URL, or null when the stored value is unusable.
export function safeExternalUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  return isHttpUrl(trimmed) ? trimmed : null;
}

// Returns a valid `tel:` href for the stored phone, or null when unusable.
export function safeTelHref(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed || !PHONE_PATTERN.test(trimmed)) {
    return null;
  }
  return `tel:${digitsOnly(trimmed)}`;
}

// Returns a safe WhatsApp deep link. Accepts either a phone number or an
// http(s) URL already pointing to a wa.me/link endpoint.
export function whatsAppHref(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  if (isHttpUrl(trimmed)) {
    return trimmed;
  }
  if (PHONE_PATTERN.test(trimmed)) {
    return `https://wa.me/${digitsOnly(trimmed)}`;
  }
  return null;
}

// Serializes structured data with `<` escaped so user-entered values cannot
// break out of an embedded JSON-LD script tag.
export function ldJsonSafe(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}