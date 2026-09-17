import "server-only";

import { cookies } from "next/headers";

import { LOCALE_COOKIE_NAME } from "@/lib/i18n/translations";
import type { Locale } from "@/types";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  return value === "ar" ? "ar" : "fr";
}