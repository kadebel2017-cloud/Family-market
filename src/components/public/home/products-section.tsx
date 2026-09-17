import { t } from "@/lib/i18n/translations";
import type { ProductCard } from "@/lib/public/queries";
import type { Locale } from "@/types";
import { ProductGridCard } from "../catalog/product-card";
import { SectionHeader } from "./section-header";

export function ProductsSection({
  products,
  locale,
}: {
  products: ProductCard[];
  locale: Locale;
}) {
  return (
    <section
      className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8"
      aria-labelledby="products-title"
    >
      <SectionHeader
        id="products-title"
        title={t(locale, "sectionProducts")}
        action={
          products.length > 0
            ? { label: t(locale, "viewAllProducts"), href: "/products" }
            : undefined
        }
      />

      {products.length === 0 ? (
        <div className="mt-7 rounded-lg border border-dashed border-black/15 bg-muted/50 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {t(locale, "productsEmpty")}
          </p>
        </div>
      ) : (
        <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">
          {products.map((product) => (
            <ProductGridCard key={product.id} product={product} locale={locale} />
          ))}
        </div>
      )}
    </section>
  );
}
