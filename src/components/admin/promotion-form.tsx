"use client";

import { useActionState } from "react";

import { Button, Input } from "@/components/ui";
import type { FormState, MutationAction } from "@/lib/actions/types";
import { Checkbox, Field, Fieldset, TextArea } from "./fields";
import { FormMessage } from "./form-message";
import { MediaField } from "./media/media-field";

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
  productIds: string[];
}

export interface PromotionFormProps {
  action: MutationAction;
  products: { id: string; nameFr: string }[];
  initial?: PromotionFormInitial;
}

export function PromotionForm({ action, products, initial }: PromotionFormProps) {
  const [state, formAction, pending] = useActionState(action, {} as FormState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}

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
        legend="Produits concernés"
        description="Cochez les produits inclus dans cette promotion."
      >
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun produit disponible. Créez d&apos;abord des produits.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {products.map((product) => {
              const checked = initial?.productIds.includes(product.id) ?? false;
              return (
                <label
                  key={product.id}
                  className="flex items-center gap-2 rounded-md border border-black/10 px-3 py-2 text-sm"
                >
                  <Checkbox name="productIds" value={product.id} defaultChecked={checked} />
                  {product.nameFr}
                </label>
              );
            })}
          </div>
        )}
      </Fieldset>

      <Fieldset legend="Médias">
        <MediaField
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