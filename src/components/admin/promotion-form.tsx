"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Percent, ScanLine, X } from "lucide-react";

import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { FormState, MutationAction } from "@/lib/actions/types";
import type { PromotionType } from "@/lib/promotions";
import {
  filterProducts,
  type SearchableProduct,
} from "@/lib/admin/product-search";
import { Checkbox, Field, Fieldset, TextArea } from "./fields";
import { FormMessage } from "./form-message";
import { MediaField } from "./media/media-field";

export interface PromotionPackItem {
  productId: string;
  quantity: number;
  promoPrice: string | null;
}

export interface PromotionFormInitial {
  id: string;
  titleFr: string;
  titleAr: string;
  descriptionFr: string | null;
  descriptionAr: string | null;
  image: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  type: PromotionType;
  packPrice: string | null;
  productIds: string[];
  items: PromotionPackItem[];
}

export interface PromotionFormProps {
  action: MutationAction;
  products: (SearchableProduct & { price: string })[];
  initial?: PromotionFormInitial;
}

function toMoney(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function productLabel(product: SearchableProduct): string {
  const sku = product.sku?.trim() ? ` · ${product.sku.trim()}` : "";
  return `${product.nameFr} (${product.size})${sku}`;
}

// Searchable product picker shared by both offer types. An exact barcode
// match is returned first; a USB/Bluetooth scanner behaves like a keyboard,
// so focusing the field is enough — no driver, no library, no camera.
function ProductPicker({
  products,
  checked,
  onSelect,
}: {
  products: (SearchableProduct & { price: string })[];
  checked: Set<string>;
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { exact, results, isBarcodeLike } = useMemo(
    () => filterProducts(products, search, checked),
    [products, search, checked],
  );
  const visible = results.slice(0, 30);

  const confirmSearch = () => {
    // Scanner sends the barcode + Enter: an exact hit is selected at once.
    if (exact && !checked.has(exact.id)) {
      onSelect(exact.id);
      setSearch("");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            // Never submit the promotion form from the search field.
            if (e.key === "Enter") {
              e.preventDefault();
              confirmSearch();
            }
          }}
          placeholder="Rechercher par nom, taille ou code-barres…"
          aria-label="Rechercher un produit"
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.focus()}
        >
          <ScanLine className="h-4 w-4" aria-hidden />
          Scanner
        </Button>
      </div>

      {search.trim() === "" ? (
        <p className="text-xs text-muted-foreground">
          Recherchez par nom (FR/AR), taille ou code-barres — ou scannez directement.
        </p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground" role="status">
          {isBarcodeLike
            ? "Produit introuvable avec ce code-barres."
            : "Aucun produit ne correspond à cette recherche."}
        </p>
      ) : (
        <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto rounded-md border border-black/10 p-2">
          {visible.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(product.id);
                  setSearch("");
                }}
                className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-gold-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {product.nameFr}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {product.size}
                    {product.sku?.trim() ? ` · ${product.sku.trim()}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-semibold text-gold-600">
                  Ajouter
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PromotionForm({ action, products, initial }: PromotionFormProps) {
  const [state, formAction, pending] = useActionState(action, {} as FormState);
  const router = useRouter();
  // Create mode only — edit forms must keep their values after save.
  const isCreate = !initial;
  const [mediaKey, setMediaKey] = useState(0);
  const [pickerKey, setPickerKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const [offerType, setOfferType] = useState<PromotionType>(
    initial?.type ?? "PRODUCT_DISCOUNT",
  );
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(initial?.productIds ?? []),
  );
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const item of initial?.items ?? []) {
      map[item.productId] = item.quantity;
    }
    return map;
  });
  const [packPrice, setPackPrice] = useState(initial?.packPrice ?? "");

  const productById = useMemo(() => {
    const map = new Map<string, (SearchableProduct & { price: string })>();
    for (const product of products) {
      map.set(product.id, product);
    }
    return map;
  }, [products]);

  const priceById = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of products) {
      map.set(product.id, toMoney(product.price));
    }
    return map;
  }, [products]);

  const selectProduct = (id: string) => {
    setChecked((prev) => {
      if (prev.has(id)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(id);
      setQuantities((q) => (q[id] ? q : { ...q, [id]: 1 }));
      return next;
    });
  };

  const removeProduct = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const promoById = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of initial?.items ?? []) {
      if (item.promoPrice !== null) {
        map.set(item.productId, item.promoPrice);
      }
    }
    return map;
  }, [initial]);

  const normalTotal = useMemo(() => {
    let total = 0;
    for (const id of checked) {
      total += (priceById.get(id) ?? 0) * (quantities[id] ?? 1);
    }
    return total;
  }, [checked, quantities, priceById]);

  const savings = useMemo(() => {
    const pack = Number.parseFloat(packPrice);
    if (!Number.isFinite(pack)) {
      return null;
    }
    return normalTotal - pack;
  }, [normalTotal, packPrice]);

  const selectedIds = [...checked];

  useEffect(() => {
    // Reset EVERYTHING only after the server confirms creation: type,
    // texts, dates, selected products, search, promo prices, quantities,
    // pack price and media selection. Errors keep all entered data.
    // The created promotion record itself is never touched. Runs once per
    // success: the updates below don't change `state`, so no loop.
    if (isCreate && state.ok && !state.error) {
      formRef.current?.reset();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOfferType("PRODUCT_DISCOUNT");
      setChecked(new Set());
      setQuantities({});
      setPackPrice("");
      setMediaKey((key) => key + 1);
      setPickerKey((key) => key + 1);
      router.refresh();
    }
  }, [state, isCreate, router]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-6">
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}

      <Fieldset legend="Type d'offre" description="Réduction sur produits ou pack groupé.">
        <div className="grid gap-2 sm:grid-cols-2">
          <label
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-sm font-medium",
              offerType === "PRODUCT_DISCOUNT"
                ? "border-gold-500 bg-gold-50"
                : "border-black/10",
            )}
          >
            <input
              type="radio"
              name="type"
              value="PRODUCT_DISCOUNT"
              checked={offerType === "PRODUCT_DISCOUNT"}
              onChange={() => setOfferType("PRODUCT_DISCOUNT")}
              className="h-4 w-4 accent-gold-500"
            />
            <Percent className="h-4 w-4 text-gold-600" aria-hidden />
            Réduction sur produits
          </label>
          <label
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-sm font-medium",
              offerType === "PACK"
                ? "border-gold-500 bg-gold-50"
                : "border-black/10",
            )}
          >
            <input
              type="radio"
              name="type"
              value="PACK"
              checked={offerType === "PACK"}
              onChange={() => setOfferType("PACK")}
              className="h-4 w-4 accent-gold-500"
            />
            <Package className="h-4 w-4 text-gold-600" aria-hidden />
            Pack / Offre groupée
          </label>
        </div>
      </Fieldset>

      <Fieldset legend="Informations" description="Champs bilingues français / arabe.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Titre (FR)" htmlFor="titleFr">
            <Input
              id="titleFr"
              name="titleFr"
              required
              defaultValue={initial?.titleFr}
              placeholder="Ex : Offre Ramadan"
            />
          </Field>
          <Field label="Titre (AR)" htmlFor="titleAr">
            <Input
              id="titleAr"
              name="titleAr"
              required
              defaultValue={initial?.titleAr}
              placeholder="مثال : عرض رمضان"
              dir="rtl"
            />
          </Field>
        </div>

        <Field label="Description (FR)" htmlFor="descriptionFr">
          <TextArea
            id="descriptionFr"
            name="descriptionFr"
            defaultValue={initial?.descriptionFr ?? ""}
          />
        </Field>
        <Field label="Description (AR)" htmlFor="descriptionAr">
          <TextArea
            id="descriptionAr"
            name="descriptionAr"
            defaultValue={initial?.descriptionAr ?? ""}
            dir="rtl"
          />
        </Field>
      </Fieldset>

      <Fieldset legend="Période">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Début" htmlFor="startDate">
            <Input
              id="startDate"
              name="startDate"
              type="datetime-local"
              required
              defaultValue={initial?.startDate}
            />
          </Field>
          <Field label="Fin" htmlFor="endDate">
            <Input
              id="endDate"
              name="endDate"
              type="datetime-local"
              required
              defaultValue={initial?.endDate}
            />
          </Field>
        </div>
      </Fieldset>

      <Fieldset
        legend={offerType === "PACK" ? "Produits du pack" : "Produits concernés"}
        description={
          offerType === "PACK"
            ? "Recherchez ou scannez les produits du pack, puis indiquez la quantité de chacun."
            : "Recherchez ou scannez les produits inclus, avec leur prix promo (laissez vide pour le prix normal)."
        }
      >
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun produit disponible. Créez d&apos;abord des produits.
          </p>
        ) : (
          <>
            <ProductPicker
              key={`picker-${pickerKey}`}
              products={products}
              checked={checked}
              onSelect={selectProduct}
            />

            {selectedIds.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun produit sélectionné pour le moment.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">
                  Produits sélectionnés ({selectedIds.length})
                </p>
                <ul className="flex flex-col gap-2">
                  {selectedIds.map((id) => {
                    const product = productById.get(id);
                    if (!product) {
                      return null;
                    }
                    const qty = quantities[id] ?? 1;
                    return (
                      <li
                        key={id}
                        className="flex flex-col gap-2 rounded-md border border-gold-500 bg-gold-50/50 px-3 py-2 text-sm"
                      >
                        <input type="hidden" name="productIds" value={id} />
                        <div className="flex items-center gap-2">
                          <span className="min-w-0 flex-1" title={productLabel(product)}>
                            <span className="block truncate font-medium">
                              {product.nameFr}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {product.size}
                              {product.sku?.trim() ? ` · ${product.sku.trim()}` : ""}
                              {" · "}
                              {toMoney(product.price).toFixed(2)} DA
                            </span>
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProduct(id)}
                            aria-label={`Retirer ${product.nameFr}`}
                            className="h-9 w-9 shrink-0 px-0"
                          >
                            <X className="h-4 w-4" aria-hidden />
                          </Button>
                        </div>
                        {offerType === "PACK" ? (
                          <label className="flex items-center gap-2 text-xs text-muted-foreground">
                            Quantité
                            <Input
                              name={`quantity_${id}`}
                              type="number"
                              min={1}
                              max={999}
                              step={1}
                              required
                              value={qty}
                              onChange={(e) => {
                                const parsed = Number.parseInt(e.target.value, 10);
                                setQuantities((q) => ({
                                  ...q,
                                  [id]: Number.isInteger(parsed) && parsed > 0 ? parsed : 1,
                                }));
                              }}
                              className="h-9 w-24"
                            />
                            <span aria-live="polite">
                              = {((priceById.get(id) ?? 0) * qty).toFixed(2)} DA
                            </span>
                          </label>
                        ) : (
                          <label className="flex items-center gap-2 text-xs text-muted-foreground">
                            Prix promo (DA)
                            <Input
                              name={`promoPrice_${id}`}
                              inputMode="decimal"
                              placeholder="Ex : 60"
                              defaultValue={promoById.get(id) ?? ""}
                              className="h-9"
                            />
                          </label>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </>
        )}

        {offerType === "PACK" ? (
          <div className="grid gap-4 rounded-md border border-gold-200 bg-gold-50/50 p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Prix normal total
              </p>
              <p className="text-lg font-bold" aria-live="polite">
                {normalTotal.toFixed(2)} DA
              </p>
            </div>
            <Field label="Prix du pack (DA)" htmlFor="packPrice">
              <Input
                id="packPrice"
                name="packPrice"
                inputMode="decimal"
                required={offerType === "PACK"}
                value={packPrice}
                onChange={(e) => setPackPrice(e.target.value)}
                placeholder="Ex : 180"
              />
            </Field>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Économie</p>
              <p className="text-lg font-bold text-emerald-700" aria-live="polite">
                {savings === null ? "—" : `${savings.toFixed(2)} DA`}
              </p>
            </div>
          </div>
        ) : null}
      </Fieldset>

      <Fieldset legend="Médias">
        <MediaField
          key={`media-${mediaKey}`}
          name="image"
          label="Image de la promotion"
          defaultValue={initial?.image}
          accept="image"
          category="PROMOTION"
          hint="Sélectionnez une image depuis la médiathèque."
        />
      </Fieldset>

      <Field label="Promotion active">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="isActive" defaultChecked={initial?.isActive ?? true} />
          Publier cette promotion
        </label>
      </Field>

      <FormMessage state={state} successLabel={initial ? "Promotion mise à jour." : "Promotion créée."} />

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : initial ? "Mettre à jour" : "Créer la promotion"}
        </Button>
      </div>
    </form>
  );
}
