import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n/translations";
import { formatTimeRange, isOpenNow } from "@/lib/public/schedule";
import type { PublicSettings } from "@/lib/public/queries";
import type { Locale } from "@/types";

export function StoreHours({
  settings,
  locale,
  className,
}: {
  settings: PublicSettings | null;
  locale: Locale;
  className?: string;
}) {
  if (!settings) {
    return null;
  }

  const times = formatTimeRange(settings.openingTime, settings.closingTime);
  const live = settings.isOpenAutomatically
    ? isOpenNow(new Date(), {
        openingTime: settings.openingTime,
        closingTime: settings.closingTime,
      })
    : null;

  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-gold-200 bg-white/95 px-4 py-2 text-sm font-medium text-foreground shadow-sm",
        className,
      )}
    >
      <Clock className="h-4 w-4 shrink-0 text-gold-600" aria-hidden />
      <span>
        {t(locale, "everyDay")} : {times}
      </span>
      {live !== null ? (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
            live
              ? "bg-emerald-100 text-emerald-800"
              : "bg-red-100 text-red-800",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              live ? "bg-emerald-500" : "bg-red-500",
            )}
          />
          {live ? t(locale, "storeOpen") : t(locale, "storeClosed")}
        </span>
      ) : null}
    </div>
  );
}