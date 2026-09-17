import { getLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/translations";
import { NotFoundState } from "@/components/public/not-found-state";

export default async function PromotionNotFound() {
  const locale = await getLocale();
  return (
    <NotFoundState
      locale={locale}
      title={t(locale, "promotionNotFoundTitle")}
      body={t(locale, "promotionNotFoundBody")}
      backHref="/promotions"
      backLabel={t(locale, "backToPromotions")}
    />
  );
}