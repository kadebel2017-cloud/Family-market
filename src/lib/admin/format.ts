// Pure formatting helpers (safe to import from client and server components).

export type DecimalLike = { toString(): string } | string | number | null | undefined;

export function formatMoney(value: DecimalLike): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  const n =
    typeof value === "string"
      ? Number.parseFloat(value)
      : Number(value.toString());
  if (Number.isNaN(n)) {
    return "—";
  }
  return `${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)} DA`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) {
    return "—";
  }
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) {
    return "—";
  }
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

// Format a Date for an <input type="datetime-local"> (browser local time).
export function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Slug: lowercase, no accents, words separated by dashes.
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type StatusTone = "success" | "warning" | "danger" | "neutral";

export interface PromotionStatusInfo {
  label: string;
  tone: StatusTone;
}

export function promotionStatus(input: {
  isActive: boolean;
  startDate: Date;
  endDate: Date;
}): PromotionStatusInfo {
  const now = Date.now();
  const start = new Date(input.startDate).getTime();
  const end = new Date(input.endDate).getTime();

  if (now < start) {
    return { label: "Planifiée", tone: "warning" };
  }
  if (now > end) {
    return { label: "Expirée", tone: "neutral" };
  }
  if (!input.isActive) {
    return { label: "Inactive", tone: "neutral" };
  }
  return { label: "Active", tone: "success" };
}