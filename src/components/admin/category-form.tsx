"use client";

import { useActionState } from "react";

import { Button, Input } from "@/components/ui";
import type { FormState, MutationAction } from "@/lib/actions/types";
import { Checkbox, Field, Fieldset, TextArea } from "./fields";
import { FormMessage } from "./form-message";
import { MediaField } from "./media/media-field";

export interface CategoryFormInitial {
  id: string;
  nameFr: string;
  nameAr: string;
  slug: string;
  descriptionFr: string | null;
  descriptionAr: string | null;
  image: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface CategoryFormProps {
  action: MutationAction;
  initial?: CategoryFormInitial;
}

export function CategoryForm({ action, initial }: CategoryFormProps) {
  const [state, formAction, pending] = useActionState(action, {} as FormState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}

      <Fieldset legend="Informations" description="Champs bilingues français / arabe.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom (FR)" htmlFor="nameFr">
            <Input
              id="nameFr"
              name="nameFr"
              required
              defaultValue={initial?.nameFr}
              placeholder="Ex : Épicerie"
            />
          </Field>
          <Field label="Nom (AR)" htmlFor="nameAr">
            <Input
              id="nameAr"
              name="nameAr"
              required
              defaultValue={initial?.nameAr}
              placeholder="مثال : بقالة"
              dir="rtl"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Identifiant (slug)"
            htmlFor="slug"
            hint="Facultatif : généré automatiquement depuis le nom si vide."
          >
            <Input
              id="slug"
              name="slug"
              defaultValue={initial?.slug}
              placeholder="epicerie"
            />
          </Field>
          <Field
            label="Position"
            htmlFor="sortOrder"
            hint="Nombre entier. Les plus petits apparaissent en premier."
          >
            <Input
              id="sortOrder"
              name="sortOrder"
              type="number"
              min={0}
              defaultValue={initial?.sortOrder ?? 0}
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

      <Fieldset legend="Médias">
        <MediaField
          name="image"
          label="Image de la catégorie"
          defaultValue={initial?.image}
          accept="image"
          category="CATEGORY"
          hint="Sélectionnez une image depuis la médiathèque."
        />
      </Fieldset>

      <Field label="Catégorie active">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="isActive" defaultChecked={initial?.isActive ?? true} />
          Visible sur le site
        </label>
      </Field>

      <FormMessage state={state} successLabel={initial ? "Catégorie mise à jour." : "Catégorie créée."} />

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : initial ? "Mettre à jour" : "Créer la catégorie"}
        </Button>
      </div>
    </form>
  );
}