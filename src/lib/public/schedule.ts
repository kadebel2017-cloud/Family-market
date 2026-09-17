export const STORE_TIME_ZONE = "Africa/Algiers";

export interface OpeningTimeInput {
  openingTime: string;
  closingTime: string;
}

export function formatTimeRange(
  openingTime: string,
  closingTime: string,
): string {
  return `${openingTime} – ${closingTime}`;
}

export function parseTimeToMinutes(value: string): number | null {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) {
    return null;
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

export function storeLocalMinutes(
  now: Date,
  timeZone: string = STORE_TIME_ZONE,
): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

export function isOpenNow(
  now: Date,
  times: OpeningTimeInput,
  timeZone: string = STORE_TIME_ZONE,
): boolean {
  const open = parseTimeToMinutes(times.openingTime);
  const close = parseTimeToMinutes(times.closingTime);
  if (open === null || close === null || open === close) {
    return false;
  }
  const current = storeLocalMinutes(now, timeZone);
  if (open < close) {
    return current >= open && current < close;
  }
  return current >= open || current < close;
}