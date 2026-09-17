import { getLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/translations";
import { NotFoundState } from "@/components/public/not-found-state";

export default async function CategoryNotFound() {
  const locale = await getLocale();
  return (
    <NotFoundState
      locale={locale}
      title={t(locale, "categoryNotFoundTitle")}
      body={t(locale, "categoryNotFoundBody")}
      backHref="/categories"
      backLabel={t(locale, "backToCategories")}
    />
  );
}