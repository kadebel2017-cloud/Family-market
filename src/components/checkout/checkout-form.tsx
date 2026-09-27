"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  CreditCard,
  Gift,
  Home,
  MapPin,
  Package,
  Phone,
  ShoppingCart,
  Truck,
  User,
} from "lucide-react";

import { Button, Input } from "@/components/ui";
import { TextArea } from "@/components/admin/fields";
import { t, tf, pickLocalized } from "@/lib/i18n/translations";
import { formatPrice } from "@/lib/public/format";
import {
  quoteFromPrices,
  type DeliveryTypeValue,
  type FreeDeliveryRuleInput,
  type WilayaOption,
  type WilayaPriceInput,
} from "@/lib/delivery-shared";
import { placeOrder } from "@/lib/actions/orders";
import type { Locale } from "@/types";
import { useCart } from "@/components/cart/cart-context";
import { usePriceRefresh } from "@/components/cart/use-price-refresh";
import { cn } from "@/lib/utils";

export function CheckoutForm({
  locale,
  wilayas,
  prices,
  freeRule,
  deliveryEnabled = true,
}: {
  locale: Locale;
  wilayas: WilayaOption[];
  prices: WilayaPriceInput[];
  freeRule: FreeDeliveryRuleInput | null;
  deliveryEnabled?: boolean;
}) {
  const router = useRouter();
  const { lines, subtotal, normalTotal, clear } = useCart();
  const { changed: pricesChanged } = usePriceRefresh();
  const hasPack = lines.some((line) => line.kind === "pack");

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [wilayaCode, setWilayaCode] = useState("");
  const [commune, setCommune] = useState("");
  const [showCommunes, setShowCommunes] = useState(false);
  const [deliveryType, setDeliveryType] = useState<DeliveryTypeValue | "FREE">("HOME");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);

  const communes = useMemo(() => {
    const wilaya = wilayas.find((item) => item.code === wilayaCode);
    return wilaya ? wilaya.communes : [];
  }, [wilayas, wilayaCode]);

  const filteredCommunes = useMemo(() => {
    const query = commune.trim().toLowerCase();
    if (!query) {
      return communes;
    }
    return communes.filter((name) => name.toLowerCase().includes(query));
  }, [communes, commune]);

  // Free delivery is offered only when the admin rule is ON and the
  // cart reaches its threshold. Selecting it locks the delivery zone to
  // the admin-configured wilaya / commune / district.
  // Global service switch (Admin → Livraison). OFF only disables the
  // existing delivery fields and shows the notice — nothing else changes.
  const fieldsDisabled = !deliveryEnabled;
  const freeEligible =
    deliveryEnabled &&
    freeRule !== null &&
    freeRule.isEnabled &&
    subtotal > 0 &&
    subtotal >= freeRule.threshold;

  // If the cart drops below the threshold (live price refresh), the
  // stale FREE choice resolves back to home delivery everywhere below.
  const resolvedType: DeliveryTypeValue | "FREE" =
    deliveryType === "FREE" && !freeEligible ? "HOME" : deliveryType;
  const isFree = resolvedType === "FREE";

  // Live preview with the exact same rule the server enforces.
  const quote = useMemo(() => {
    if (isFree) {
      return { matched: freeEligible, fee: 0 };
    }
    return quoteFromPrices(prices, { wilayaCode, deliveryType: resolvedType });
  }, [prices, wilayaCode, resolvedType, isFree, freeEligible]);

  const showQuote = isFree || wilayaCode !== "";
  const total = subtotal + quote.fee;
  const isHome = resolvedType === "HOME";

  function selectDeliveryType(value: DeliveryTypeValue | "FREE") {
    setDeliveryType(value);
    if (value === "FREE" && freeRule) {
      // Lock the zone — customer only fills name + phone.
      setWilayaCode(freeRule.wilayaCode);
      setCommune(freeRule.commune);
      setAddress(freeRule.district);
      setShowCommunes(false);
    }
  }

  function handleWilayaChange(value: string) {
    setWilayaCode(value);
    setCommune("");
    setShowCommunes(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting || placed || lines.length === 0) {
      return;
    }
    setServerError(null);
    if (isFree && !freeEligible) {
      setServerError(t(locale, "checkoutUncovered"));
      return;
    }
    setSubmitting(true);
    const result = await placeOrder({
      customerName,
      phone,
      wilayaCode,
      commune,
      deliveryType: resolvedType,
      address,
      notes,
      items: lines.flatMap((line) =>
        line.kind === "product"
          ? [{ productId: line.productId, qty: line.qty }]
          : [],
      ),
      packs: lines.flatMap((line) =>
        line.kind === "pack" ? [{ packId: line.packId, qty: line.qty }] : [],
      ),
    });
    if (result.ok) {
      setPlaced(true);
      clear();
      router.push(`/checkout/success?order=${encodeURIComponent(result.orderNumber)}`);
    } else {
      setServerError(result.error);
      setSubmitting(false);
    }
  }

  if (lines.length === 0 && !placed) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 py-16 text-center">
        <ShoppingCart className="h-12 w-12 text-muted-foreground/50" aria-hidden />
        <div>
          <p className="text-lg font-semibold text-foreground">{t(locale, "cartEmpty")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t(locale, "cartEmptyHint")}</p>
        </div>
        <Button href="/products" variant="outline">
          {t(locale, "cartContinue")}
        </Button>
      </div>
    );
  }

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"} className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          {t(locale, "checkoutTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t(locale, "checkoutCod")}</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
              {t(locale, "checkoutFullName")} *
              <span className="relative">
                <User className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  required
                  minLength={3}
                  placeholder="Amira Bensalem"
                  className="ps-10"
                />
              </span>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
              {t(locale, "checkoutPhone")} *
              <span className="relative">
                <Phone className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  required
                  inputMode="tel"
                  placeholder="0555 12 34 56"
                  className="ps-10"
                />
              </span>
            </label>
          </div>

          {fieldsDisabled ? (
            <p
              role="status"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700"
            >
              {t(locale, "serviceDisabledNotice")}
            </p>
          ) : null}

          {isFree && freeRule ? (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-foreground">
              <Gift className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
              <div>
                <p className="font-semibold">{t(locale, "checkoutFreeDelivery")}</p>
                <p className="mt-1 text-muted-foreground">
                  {freeRule.wilayaCode} — {freeRule.wilayaName} · {freeRule.commune} ·{" "}
                  {freeRule.district}
                </p>
              </div>
            </div>
          ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
              {t(locale, "checkoutWilaya")} *
              <span className="relative">
                <MapPin className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <select
                  value={wilayaCode}
                  onChange={(event) => handleWilayaChange(event.target.value)}
                  required
                  disabled={fieldsDisabled}
                  className="flex h-11 w-full appearance-none rounded-md border border-black/15 bg-surface py-2 pe-3 ps-10 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">{t(locale, "checkoutSelectWilaya")}</option>
                  {wilayas.map((wilaya) => (
                    <option key={wilaya.code} value={wilaya.code}>
                      {wilaya.code} — {wilaya.name}
                    </option>
                  ))}
                </select>
              </span>
            </label>

            <div className="relative flex flex-col gap-1.5 text-sm font-medium text-foreground">
              <label htmlFor="checkout-commune">
                {t(locale, "checkoutCommune")} *
              </label>
              <Input
                id="checkout-commune"
                value={commune}
                onChange={(event) => {
                  setCommune(event.target.value);
                  setShowCommunes(true);
                }}
                onFocus={() => setShowCommunes(true)}
                onBlur={() => window.setTimeout(() => setShowCommunes(false), 150)}
                required
                disabled={!wilayaCode || fieldsDisabled}
                placeholder={
                  wilayaCode
                    ? t(locale, "checkoutCommunePlaceholder")
                    : t(locale, "checkoutSelectWilayaFirst")
                }
                autoComplete="off"
              />
              {showCommunes && filteredCommunes.length > 0 ? (
                <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-44 overflow-y-auto rounded-md border border-black/15 bg-surface shadow-lg">
                  {filteredCommunes.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onMouseDown={() => {
                        setCommune(name);
                        setShowCommunes(false);
                      }}
                      className="w-full px-3 py-2 text-start text-sm font-normal text-foreground transition-colors hover:bg-black/5"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          )}

          <fieldset>
            <legend className="text-sm font-medium text-foreground">
              {t(locale, "checkoutDeliveryType")} *
            </legend>
            <div
              className={cn(
                "mt-2 grid gap-3 sm:grid-cols-2",
                freeEligible && "sm:grid-cols-3",
              )}
            >
              {(
                [
                  { value: "HOME", label: t(locale, "checkoutHomeDelivery"), Icon: Home },
                  { value: "OFFICE", label: t(locale, "checkoutShippingOffice"), Icon: Package },
                  ...(freeEligible
                    ? [
                        {
                          value: "FREE" as const,
                          label: t(locale, "checkoutFreeDelivery"),
                          Icon: Gift,
                        },
                      ]
                    : []),
                ] satisfies { value: DeliveryTypeValue | "FREE"; label: string; Icon: typeof Home }[]
              ).map(({ value, label, Icon }) => {
                const active = resolvedType === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => selectDeliveryType(value)}
                    disabled={fieldsDisabled}
                    aria-pressed={active}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border-2 p-4 text-start transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                      active
                        ? "border-gold-500 bg-gold-50"
                        : "border-black/10 bg-surface hover:border-black/25",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                        active ? "border-gold-500" : "border-black/25",
                      )}
                    >
                      {active ? <span className="h-2.5 w-2.5 rounded-full bg-gold-500" /> : null}
                    </span>
                    <Icon className="h-4 w-4 shrink-0 text-gold-600" aria-hidden />
                    <span className="text-sm font-semibold text-foreground">{label}</span>
                  </button>
                );
              })}
            </div>
            {freeRule?.isEnabled && !freeEligible ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {tf(
                  locale,
                  "freeThresholdHint",
                  formatPrice(locale, freeRule.threshold),
                  freeRule.wilayaName,
                  freeRule.commune,
                )}
              </p>
            ) : null}
          </fieldset>

          {isFree ? null : isHome ? (
            <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
              {t(locale, "checkoutAddress")} *
              <TextArea
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                required={isHome}
                disabled={fieldsDisabled}
                rows={3}
                placeholder={t(locale, "checkoutAddressPlaceholder")}
              />
            </label>
          ) : (
            <p className="flex items-start gap-2 rounded-lg border border-gold-300 bg-gold-50 p-4 text-sm text-foreground">
              <Truck className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" aria-hidden />
              {t(locale, "checkoutOfficeMessage")}
            </p>
          )}

          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            {t(locale, "checkoutNotes")}
            <TextArea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              placeholder={t(locale, "checkoutNotesPlaceholder")}
            />
          </label>

          {serverError ? (
            <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {serverError}
            </p>
          ) : null}

          <Button type="submit" size="lg" className="w-full" disabled={submitting || placed}>
            {placed ? (
              <>
                <Check className="h-5 w-5" aria-hidden />
                {t(locale, "checkoutOrderPlaced")}
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5" aria-hidden />
                {submitting ? "…" : t(locale, "checkoutPlaceOrder")}
              </>
            )}
          </Button>
        </form>
      </div>

      <div className="lg:col-span-2">
        <aside className="h-fit rounded-lg border border-black/10 bg-surface p-5 shadow-sm lg:sticky lg:top-24">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <ShoppingCart className="h-5 w-5" aria-hidden />
            {t(locale, "cartSummary")}
          </h2>

          {pricesChanged ? (
            <p
              role="status"
              className="mt-3 rounded-lg border border-gold-300 bg-gold-50 px-3 py-2 text-xs text-foreground"
            >
              {t(locale, "pricesUpdatedNote")}
            </p>
          ) : null}

          <ul className="mt-4 flex max-h-64 flex-col gap-3 overflow-y-auto">
            {lines.map((line) => {
              if (line.kind === "pack") {
                const title = pickLocalized(locale, line.titleFr, line.titleAr);
                return (
                  <li key={`pack:${line.packId}`}>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gold-600">
                      {t(locale, "packLabel")} × {line.qty}
                    </p>
                    <p className="truncate text-sm font-semibold text-foreground">{title}</p>
                    <ul className="mt-1 space-y-0.5">
                      {line.items.map((item) => (
                        <li key={item.productId} className="truncate text-xs text-muted-foreground">
                          {pickLocalized(locale, item.nameFr, item.nameAr)} ×{" "}
                          {item.qty * line.qty}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-1 text-end text-sm">
                      <span className="me-2 text-xs text-muted-foreground line-through">
                        {formatPrice(locale, line.normalTotal * line.qty)}
                      </span>
                      <span className="font-bold text-gold-600">
                        {formatPrice(locale, line.packPrice * line.qty)}
                      </span>
                    </p>
                  </li>
                );
              }
              return (
                <li key={line.productId} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-foreground">
                      {pickLocalized(locale, line.nameFr, line.nameAr)}
                    </span>
                    <span className="text-xs text-muted-foreground">× {line.qty}</span>
                  </span>
                  <span className="shrink-0 font-semibold text-foreground">
                    {formatPrice(locale, line.price * line.qty)}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 space-y-2 border-t border-black/10 pt-4 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>
                {hasPack ? t(locale, "normalTotalLabel") : t(locale, "cartSubtotal")}
              </span>
              <span className={hasPack ? "line-through" : ""}>
                {formatPrice(locale, hasPack ? normalTotal : subtotal)}
              </span>
            </div>
            {hasPack ? (
              <div className="flex items-center justify-between text-muted-foreground">
                <span>{t(locale, "packPriceLabel")}</span>
                <span className="font-semibold text-foreground">
                  {formatPrice(locale, subtotal)}
                </span>
              </div>
            ) : null}
            <div className="flex items-center justify-between text-muted-foreground">
              <span>{t(locale, "checkoutDelivery")}</span>
              <span>
                {!showQuote ? (
                  "—"
                ) : !quote.matched ? (
                  <span className="font-medium text-red-600">{t(locale, "checkoutUncovered")}</span>
                ) : isFree ? (
                  <span className="font-bold text-emerald-600">{t(locale, "checkoutFree")}</span>
                ) : (
                  formatPrice(locale, quote.fee)
                )}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-4">
            <span className="text-base font-bold text-foreground">{t(locale, "checkoutTotal")}</span>
            <span className="text-xl font-bold text-foreground">{formatPrice(locale, total)}</span>
          </div>

          <div className="mt-4 space-y-1.5 rounded-lg bg-black/5 p-3 text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {t(locale, "checkoutPayOnDelivery")}
            </p>
            <p className="flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {t(locale, "checkoutConfirmCall")}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
