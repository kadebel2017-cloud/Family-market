"use client";

import { useActionState, useRef } from "react";
import {
  CheckCircle2,
  Hash,
  Image as ImageIcon,
  Package,
  ScanLine,
  Tag,
} from "lucide-react";

import { Button, Input } from "@/components/ui";
import type { FormState, MutationAction } from "@/lib/actions/types";
import { Checkbox, Field, Fieldset, Select, TextArea } from "./fields";
import { FormMessage } from "./form-message";
import { MediaField } from "./media/media-field";

export interface ProductFormInitial {
  id: string;
  nameFr: string;
  nameAr: string;
  slug: string;
  descriptionFr: string | null;
  descriptionAr: string | null;
  size: string;
  sku: string | null;
  price: string;
  salePrice: string | null;
  image: string | null;
  isAvailable: boolean;
  categoryId: string;
}

export interface ProductFormProps {
  action: MutationAction;
  categories: { id: string; nameFr: string; nameAr: string }[];
  initial?: ProductFormInitial;
}

export function ProductForm({ action, categories, initial }: ProductFormProps) {
  const [state, formAction, pending] = useActionState(action, {} as FormState);
  // USB/Bluetooth scanners behave like keyboards: focusing the input is
  // enough — scanned text appears automatically, no driver or library.
  const skuRef = useRef<HTMLInputElement>(null);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}

      <Fieldset
        legend="Informations produit"
        description="Champs bilingues français / arabe."
        icon={Package}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom (FR)" htmlFor="nameFr">
            <Input
              id="nameFr"
              name="nameFr"
              required
              defaultValue={initial?.nameFr}
              placeholder="Ex : Couscous aux légumes"
            />
          </Field>
          <Field label="Nom (AR)" htmlFor="nameAr">
            <Input
              id="nameAr"
              name="nameAr"
              required
              defaultValue={initial?.nameAr}
              placeholder="مثال : كسكسي بالخضار"
              dir="rtl"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Catégorie" htmlFor="categoryId">
            <Select
              id="categoryId"
              name="categoryId"
              required
              defaultValue={initial?.categoryId}
            >
              <option value="" disabled>
                Sélectionner une catégorie
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nameFr} · {category.nameAr}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Taille / format (FR)"
            htmlFor="size"
            hint="Ex : 1 kg, 33 cl, Taille 3."
          >
            <Input
              id="size"
              name="size"
              required
              defaultValue={initial?.size}
              placeholder="1 kg"
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

      <Fieldset legend="Prix" icon={Tag}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prix (DA)" htmlFor="price">
            <Input
              id="price"
              name="price"
              type="text"
              inputMode="decimal"
              required
              defaultValue={initial?.price}
              placeholder="1500"
            />
          </Field>
          <Field
            label="Prix promo (DA)"
            htmlFor="salePrice"
            hint="Laisser vide si aucun rabais."
          >
            <Input
              id="salePrice"
              name="salePrice"
              type="text"
              inputMode="decimal"
              defaultValue={initial?.salePrice ?? ""}
              placeholder="1200"
            />
          </Field>
        </div>
      </Fieldset>

      <Fieldset legend="Média" icon={ImageIcon}>
        <MediaField
          name="image"
          label="Image du produit"
          defaultValue={initial?.image}
          accept="image"
          category="PRODUCT"
          hint="Sélectionnez une image depuis la médiathèque."
        />
      </Fieldset>

      <Fieldset legend="Disponibilité" icon={CheckCircle2}>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox name="isAvailable" defaultChecked={initial?.isAvailable ?? true} />
          Produit visible et disponible à la vente
        </label>
      </Fieldset>

      <Fieldset
        legend="Identification (facultatif)"
        description="Références internes utilisées pour le suivi et l'adresse web."
        icon={Hash}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Identifiant (slug)"
            htmlFor="slug"
            hint="Généré automatiquement depuis le nom si vide."
          >
            <Input
              id="slug"
              name="slug"
              defaultValue={initial?.slug}
              placeholder="couscous-aux-legumes"
            />
          </Field>
          <Field
            label="SKU / Code-barres"
            htmlFor="sku"
            hint="Scannez ou saisissez le code-barres. Référence interne."
          >
            <div className="flex items-center gap-2">
              <Input
                ref={skuRef}
                id="sku"
                name="sku"
                defaultValue={initial?.sku ?? ""}
                placeholder="Ex : 6131234567890"
                className="flex-1"
                onKeyDown={(e) => {
                  // Scanners often send Enter after the code: keep the value
                  // without accidentally submitting the whole form.
                  if (e.key === "Enter") {
                    e.preventDefault();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => skuRef.current?.focus()}
              >
                <ScanLine className="h-4 w-4" aria-hidden />
                Scanner
              </Button>
            </div>
          </Field>
        </div>
      </Fieldset>

      <FormMessage state={state} successLabel={initial ? "Produit mis à jour." : "Produit créé."} />

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : initial ? "Mettre à jour" : "Créer le produit"}
        </Button>
      </div>
    </form>
  );
}