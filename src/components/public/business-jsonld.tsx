import { SITE_URL, ldJsonSafe, safeExternalUrl } from "@/lib/public/site";
import { parseTimeToMinutes } from "@/lib/public/schedule";
import type { PublicSettings } from "@/lib/public/queries";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export function businessJsonLd(
  settings: PublicSettings | null,
): Record<string, unknown> {
  const business: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "GroceryStore",
    "@id": `${SITE_URL}/#business`,
    name: settings?.storeNameFr?.trim() || "Family Market",
    url: SITE_URL,
  };

  const telephone = settings?.phone?.trim().replace(/[^\d]/g, "");
  if (telephone && telephone.length >= 6) {
    business.telephone = `+${telephone}`;
  }

  const address = settings?.addressFr?.trim();
  if (address) {
    business.address = {
      "@type": "PostalAddress",
      streetAddress: address,
    };
  }

  const opensOk =
    settings &&
    parseTimeToMinutes(settings.openingTime) !== null &&
    parseTimeToMinutes(settings.closingTime) !== null;
  if (settings && opensOk) {
    business.openingHoursSpecification = [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: DAYS,
        opens: settings.openingTime,
        closes: settings.closingTime,
      },
    ];
  }

  const sameAs = (
    [
      settings?.facebookUrl,
      settings?.instagramUrl,
      settings?.tiktokUrl,
    ] as (string | null | undefined)[]
  )
    .map(safeExternalUrl)
    .filter((url): url is string => Boolean(url));
  if (sameAs.length > 0) {
    business.sameAs = sameAs;
  }

  return business;
}

export function BusinessJsonLd({
  settings,
}: {
  settings: PublicSettings | null;
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: ldJsonSafe(businessJsonLd(settings)) }}
    />
  );
}