"use client";

import { useActionState } from "react";
import {
  Clock,
  Image as ImageIcon,
  MapPin,
  Phone,
  Share2,
  Store,
} from "lucide-react";

import { Button, Input } from "@/components/ui";
import type { FormState, MutationAction } from "@/lib/actions/types";
import { Checkbox, Field, Fieldset } from "./fields";
import { FormMessage } from "./form-message";
import { MediaField } from "./media/media-field";

export interface SettingsFormInitial {
  storeNameFr: string;
  storeNameAr: string;
  phone: string;
  whatsapp: string | null;
  addressFr: string | null;
  addressAr: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  googleMapsUrl: string | null;
  logoImage: string | null;
  heroMedia: string | null;
  openingTime: string;
  closingTime: string;
  isOpenAutomatically: boolean;
}

export interface SettingsFormProps {
  action: MutationAction;
  initial?: SettingsFormInitial;
}

export function SettingsForm({ action, initial }: SettingsFormProps) {
  const [state, formAction, pending] = useActionState(action, {} as FormState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Fieldset
        legend="Identité"
        description="Champs bilingues français / arabe."
        icon={Store}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom de la boutique (FR)" htmlFor="storeNameFr">
            <Input
              id="storeNameFr"
              name="storeNameFr"
              required
              defaultValue={initial?.storeNameFr}
              placeholder="Family Market"
            />
          </Field>
          <Field label="Nom de la boutique (AR)" htmlFor="storeNameAr">
            <Input
              id="storeNameAr"
              name="storeNameAr"
              required
              defaultValue={initial?.storeNameAr}
              placeholder="اسم المتجر بالعربية"
              dir="rtl"
            />
          </Field>
        </div>
      </Fieldset>

      <Fieldset legend="Contact" icon={Phone}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Téléphone" htmlFor="phone">
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={initial?.phone ?? ""}
              placeholder="Ex. 0550 00 00 00"
            />
          </Field>
          <Field label="WhatsApp" htmlFor="whatsapp">
            <Input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              defaultValue={initial?.whatsapp ?? ""}
              placeholder="Ex. 0550 00 00 00"
            />
          </Field>
        </div>
      </Fieldset>

      <Fieldset legend="Adresse" icon={MapPin}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Adresse (FR)" htmlFor="addressFr">
            <Input
              id="addressFr"
              name="addressFr"
              defaultValue={initial?.addressFr ?? ""}
              placeholder="Ville, quartier, rue…"
            />
          </Field>
          <Field label="Adresse (AR)" htmlFor="addressAr">
            <Input
              id="addressAr"
              name="addressAr"
              defaultValue={initial?.addressAr ?? ""}
              placeholder="الولاية، الحي، الشارع…"
              dir="rtl"
            />
          </Field>
        </div>

        <Field
          label="Lien Google Maps"
          htmlFor="googleMapsUrl"
          hint="Lien du repère affiché sur la page de contact."
        >
          <Input
            id="googleMapsUrl"
            name="googleMapsUrl"
            defaultValue={initial?.googleMapsUrl ?? ""}
            placeholder="https://maps.google.com/…"
          />
        </Field>
      </Fieldset>

      <Fieldset legend="Réseaux sociaux" icon={Share2}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Facebook" htmlFor="facebookUrl">
            <Input
              id="facebookUrl"
              name="facebookUrl"
              defaultValue={initial?.facebookUrl ?? ""}
              placeholder="https://facebook.com/…"
            />
          </Field>
          <Field label="Instagram" htmlFor="instagramUrl">
            <Input
              id="instagramUrl"
              name="instagramUrl"
              defaultValue={initial?.instagramUrl ?? ""}
              placeholder="https://instagram.com/…"
            />
          </Field>
          <Field label="TikTok" htmlFor="tiktokUrl">
            <Input
              id="tiktokUrl"
              name="tiktokUrl"
              defaultValue={initial?.tiktokUrl ?? ""}
              placeholder="https://tiktok.com/@…"
            />
          </Field>
        </div>
      </Fieldset>

      <Fieldset legend="Horaires" icon={Clock}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ouverture" htmlFor="openingTime">
            <Input
              id="openingTime"
              name="openingTime"
              type="time"
              required
              defaultValue={initial?.openingTime ?? "09:00"}
            />
          </Field>
          <Field label="Fermeture" htmlFor="closingTime">
            <Input
              id="closingTime"
              name="closingTime"
              type="time"
              required
              defaultValue={initial?.closingTime ?? "21:00"}
            />
          </Field>
        </div>

        <Field label="Ouverture / fermeture automatique">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              name="isOpenAutomatically"
              defaultChecked={initial?.isOpenAutomatically ?? true}
            />
            Calculer l&apos;état ouvert/fermé selon les horaires
          </label>
        </Field>
      </Fieldset>

      <Fieldset
        legend="Identité visuelle"
        description="Médias déjà téléversés dans la bibliothèque."
        icon={ImageIcon}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <MediaField
            name="logoImage"
            label="Logo"
            accept="image"
            category="LOGO"
            defaultValue={initial?.logoImage}
            chooseLabel="Choisir un logo"
            hint="Catégorie « Logo » recommandée dans la bibliothèque."
          />
          <MediaField
            name="heroMedia"
            label="Image / vidéo de la vitrine"
            accept="all"
            category="HERO"
            defaultValue={initial?.heroMedia}
            chooseLabel="Choisir un média"
            hint="Catégorie « Vitrine » recommandée pour l'image de couverture."
          />
        </div>
      </Fieldset>

      <FormMessage state={state} successLabel="Paramètres enregistrés." />

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}