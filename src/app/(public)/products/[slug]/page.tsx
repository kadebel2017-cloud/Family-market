import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getLocale } from "@/lib/i18n/locale";
import { t, tf, pickLocalized } from "@/lib/i18n/translations";
import { getProductBySlug } from "@/lib/public/queries";
import { discountPercent, formatPrice, hasDiscount } from "@/lib/public/format";
import { ImageFallback } from "@/components/public/image-fallback";

type ProductParams = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: ProductParams): Promise<Metadata> {
  const { slug } = await params;
  const [locale, product] = await Promise.all([
    getLocale(),
    getProductBySlug(slug),
  ]);
  if (!product) {
    return { title: t(locale, "titleProducts") };
  }
  const name = pickLocalized(locale, product.nameFr, product.nameAr);
  const description =
    pickLocalized(locale, product.descriptionFr, product.descriptionAr) ||
    `${name} — ${t(locale, "titleProducts")}`;
  return {
    title: name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: name,
      description,
      locale: locale === "ar" ? "ar_DZ" : "fr_FR",
      type: "website",
      images: product.image ? [{ url: product.image, alt: name }] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: ProductParams) {
  const { slug } = await params;
  const locale = await getLocale();
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const name = pickLocalized(locale, product.nameFr, product.nameAr);
  const description = pickLocalized(
    locale,
    product.descriptionFr,
    product.descriptionAr,
  );
  const categoryName = pickLocalized(
    locale,
    product.category.nameFr,
    product.category.nameAr,
  );
  const onSale = hasDiscount(product.price, product.salePrice);
  const discount = discountPercent(product.price, product.salePrice);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <li>
            <Link
              href="/products"
              className="rounded-md transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            >
              {t(locale, "navProducts")}
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </li>
          <li>
            <Link
              href={`/products?category=${product.category.slug}`}
              className="rounded-md transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            >
              {categoryName}
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </li>
          <li
            aria-current="page"
            className="font-medium text-foreground"
          >
            {name}
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-lg border border-black/10 bg-black/5">
          {product.image ? (
            <Image
              src={product.image}
              alt={name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <ImageFallback kind="product" iconClassName="h-14 w-14" />
          )}
          {onSale ? (
            <Badge variant="gold" className="absolute start-3 top-3">
              {discount && discount > 0
                ? tf(locale, "discount", discount)
                : t(locale, "onSale")}
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <Link
              href={`/products?category=${product.category.slug}`}
              className="rounded-md text-sm font-medium text-gold-600 transition-colors hover:text-gold-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            >
              {categoryName}
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
              {name}
            </h1>
            {product.size ? (
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {product.size}
              </p>
            ) : null}
          </div>

          <div className="rounded-lg border border-black/10 bg-surface p-5 shadow-sm">
            {onSale && product.salePrice ? (
              <p className="flex flex-wrap items-baseline gap-3">
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(locale, product.price)}
                </span>
                <span className="text-3xl font-bold text-gold-600">
                  {formatPrice(locale, product.salePrice)}
                </span>
              </p>
            ) : (
              <p className="text-3xl font-bold text-foreground">
                {formatPrice(locale, product.price)}
              </p>
            )}
          </div>

          {description ? (
            <p className="whitespace-pre-line break-words text-base leading-relaxed text-foreground/90">
              {description}
            </p>
          ) : null}

          <div className="mt-1 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="inline-flex h-11 items-center gap-2 rounded-md border border-black/15 bg-surface px-5 text-sm font-semibold text-foreground transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            >
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
              {t(locale, "backToProducts")}
            </Link>
            <Link
              href={`/categories/${product.category.slug}`}
              className="inline-flex h-11 items-center rounded-md bg-gold-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
            >
              {t(locale, "viewCategory")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
