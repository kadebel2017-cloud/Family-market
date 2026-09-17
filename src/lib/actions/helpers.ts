import { Prisma } from "@/generated/prisma/client";

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

export function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function optionalText(formData: FormData, key: string): string | null {
  const value = text(formData, key);
  return value === "" ? null : value;
}

export function checkboxBool(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return false;
  }
  return value === "on" || value === "true" || value === "1";
}

export function parseRequiredText(
  formData: FormData,
  key: string,
  label: string,
): Parsed<string> {
  const value = text(formData, key);
  if (!value) {
    return { ok: false, error: `${label} est requis.` };
  }
  return { ok: true, value };
}

export function parseDecimal(
  raw: FormDataEntryValue | null,
  required: boolean,
  label: string,
): Parsed<Prisma.Decimal | null> {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (value === "") {
    if (required) {
      return { ok: false, error: `${label} est requis.` };
    }
    return { ok: true, value: null };
  }
  if (!/^\d{1,12}([.,]\d{1,2})?$/.test(value)) {
    return {
      ok: false,
      error: `${label} invalide (exemple : 1500 ou 1500,50).`,
    };
  }
  const decimal = new Prisma.Decimal(value.replace(",", "."));
  if (decimal.isNegative()) {
    return { ok: false, error: `${label} doit être supérieur ou égal à 0.` };
  }
  return { ok: true, value: decimal };
}

export function parseRequiredDecimal(
  raw: FormDataEntryValue | null,
  label: string,
): Parsed<Prisma.Decimal> {
  const result = parseDecimal(raw, true, label);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  if (result.value === null) {
    return { ok: false, error: `${label} est requis.` };
  }
  return { ok: true, value: result.value };
}

export function parseDate(
  raw: FormDataEntryValue | null,
  label: string,
): Parsed<Date> {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) {
    return { ok: false, error: `${label} est requise.` };
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: `${label} est invalide.` };
  }
  return { ok: true, value: date };
}

export function parseId(raw: FormDataEntryValue | null): Parsed<string> {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) {
    return { ok: false, error: "Référence invalide." };
  }
  return { ok: true, value };
}

export function parseSortOrder(raw: FormDataEntryValue | null): number {
  const value = typeof raw === "string" ? raw.trim() : "";
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

export function prismaError(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const code = (error as { code?: unknown }).code;
    if (code === "P2002") {
      return "Cette référence (slug) est déjà utilisée par un autre élément.";
    }
    if (code === "P2003") {
      return "Cet élément est référencé par d'autres données et ne peut pas être supprimé.";
    }
    if (code === "P2025") {
      return "Cet élément n'existe plus.";
    }
  }
  console.error("[admin]", fallback, error);
  return fallback;
}