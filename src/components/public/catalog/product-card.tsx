import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { t, tf, pickLocalized } from "@/lib/i18n/translations";
import { discountPercent, formatPrice, hasDiscount } from "@/lib/public/format";
import type { ProductCard } from "@/lib/public/queries";
import type { Locale } from "@/types";
import { ImageFallback } from "../image-fallback";

export function ProductGridCard({
  product,
  locale,
}: {
  product: ProductCard;
  locale: Locale;
}) {
  const name = pickLocalized(locale, product.nameFr, product.nameAr);
  const categoryName = pickLocalized(
    locale,
    product.categoryFr,
    product.categoryAr,
  );
  const onSale = hasDiscount(product.price, product.salePrice);
  const discount = discountPercent(product.price, product.salePrice);
  const href = `/products/${product.slug}`;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-black/10 bg-surface shadow-sm transition-[border-color,box-shadow] hover:border-gold-500 hover:shadow-md">
      <Link
        href={href}
        className="relative block aspect-[4/3] overflow-hidden bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-500"
      >
        {product.image ? (
          <Image
            src={product.image}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <ImageFallback kind="product" />
        )}
        {onSale ? (
          <Badge variant="gold" className="absolute start-2 top-2">
            {discount && discount > 0
              ? tf(locale, "discount", discount)
              : t(locale, "onSale")}
          </Badge>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
          <Link
            href={href}
            className="rounded-md transition-colors hover:text-gold-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          >
            {name}
          </Link>
        </h3>
        {product.size ? (
          <p className="text-xs text-muted-foreground">{product.size}</p>
        ) : null}
        {categoryName ? (
          <p className="text-xs text-muted-foreground">{categoryName}</p>
        ) : null}
        <div className="mt-auto pt-2">
          {onSale && product.salePrice ? (
            <p className="flex flex-wrap items-baseline gap-2">
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(locale, product.price)}
              </span>
              <span className="text-lg font-bold text-gold-600">
                {formatPrice(locale, product.salePrice)}
              </span>
            </p>
          ) : (
            <p className="text-lg font-bold text-foreground">
              {formatPrice(locale, product.price)}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
