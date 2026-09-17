import { getLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/translations";
import { NotFoundState } from "@/components/public/not-found-state";

export default async function ProductNotFound() {
  const locale = await getLocale();
  return (
    <NotFoundState
      locale={locale}
      title={t(locale, "productNotFoundTitle")}
      body={t(locale, "productNotFoundBody")}
      backHref="/products"
      backLabel={t(locale, "backToProducts")}
    />
  );
}