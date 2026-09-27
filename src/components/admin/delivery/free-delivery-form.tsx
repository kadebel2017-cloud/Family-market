"use client";

import { useActionState, useMemo, useState } from "react";
import { Gift } from "lucide-react";

import { Button, Input } from "@/components/ui";
import { Checkbox, Field, Fieldset } from "@/components/admin/fields";
import { FormMessage } from "@/components/admin/form-message";
import { ALGERIA_WILAYAS } from "@/data/algeria-wilayas";
import type { FormState, MutationAction } from "@/lib/actions/types";

export interface FreeDeliveryRuleValue {
  isEnabled: boolean;
  threshold: string;
  wilayaCode: string;
  commune: string;
  district: string;
  bannerEnabled: boolean;
  bannerTextFr: string | null;
  bannerTextAr: string | null;
}

export function FreeDeliveryForm({
  action,
  initial,
}: {
  action: MutationAction;
  initial: FreeDeliveryRuleValue | null;
}) {
  const [state, formAction, pending] = useActionState(action, {} as FormState);
  const [ruleOn, setRuleOn] = useState(initial?.isEnabled ?? false);
  const [wilayaCode, setWilayaCode] = useState(initial?.wilayaCode ?? "31");

  // Same source as checkout: communes of the selected wilaya.
  const communes = useMemo(
    () => ALGERIA_WILAYAS.find((wilaya) => wilaya.code === wilayaCode)?.communes ?? [],
    [wilayaCode],
  );
  const [commune, setCommune] = useState(() =>
    initial && communes.includes(initial.commune)
      ? initial.commune
      : (communes[0] ?? ""),
  );

  function handleWilayaChange(value: string) {
    setWilayaCode(value);
    const next =
      ALGERIA_WILAYAS.find((wilaya) => wilaya.code === value)?.communes ?? [];
    setCommune(next[0] ?? "");
  }

  return (
    <form action={formAction}>
      <Fieldset
        legend="Livraison gratuite"
        description="Quand elle est activée et que le panier atteint le seuil, la commande propose un mode « Livraison gratuite » verrouillé sur la wilaya, la commune et le quartier ci-dessous."
        icon={Gift}
      >
        <Field label="Activation">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              name="isEnabled"
              checked={ruleOn}
              onChange={(event) => setRuleOn(event.target.checked)}
            />
            Activer la livraison gratuite
          </label>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Seuil (DA)"
            htmlFor="free-threshold"
            hint="Montant minimum du sous-total pour en bénéficier."
          >
            <Input
              id="free-threshold"
              name="threshold"
              required
              inputMode="decimal"
              defaultValue={initial?.threshold ?? "2000"}
              placeholder="2000"
            />
          </Field>
          <Field label="Wilaya" htmlFor="free-wilayaCode">
            <select
              id="free-wilayaCode"
              name="wilayaCode"
              required
              value={wilayaCode}
              onChange={(event) => handleWilayaChange(event.target.value)}
              className="flex h-11 w-full rounded-md border border-black/15 bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            >
              {ALGERIA_WILAYAS.map((wilaya) => (
                <option key={wilaya.code} value={wilaya.code}>
                  {wilaya.code} — {wilaya.name}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Commune"
            htmlFor="free-commune"
            hint="Communes de la wilaya choisie (comme à la commande)."
          >
            <select
              id="free-commune"
              name="commune"
              required
              value={commune}
              onChange={(event) => setCommune(event.target.value)}
              disabled={communes.length === 0}
              className="flex h-11 w-full rounded-md border border-black/15 bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {communes.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Quartier / adresse imposée"
            htmlFor="free-district"
            hint="Adresse pré-remplie et verrouillée à la commande."
          >
            <Input
              id="free-district"
              name="district"
              required
              defaultValue={initial?.district ?? "St Remy"}
              placeholder="St Remy"
            />
          </Field>
        </div>

        <div className="space-y-4 border-t border-black/10 pt-4">
          <Field
            label="Bannière promotionnelle"
            hint="Affichée en haut de toutes les pages du site. Impossible à activer tant que la livraison gratuite est désactivée."
          >
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                name="bannerEnabled"
                defaultChecked={initial?.bannerEnabled ?? false}
                disabled={!ruleOn}
              />
              Afficher la bannière
            </label>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Texte (FR)" htmlFor="free-banner-fr">
              <Input
                id="free-banner-fr"
                name="bannerTextFr"
                defaultValue={initial?.bannerTextFr ?? ""}
                placeholder="Livraison gratuite dès 2000 DA"
              />
            </Field>
            <Field label="Texte (AR)" htmlFor="free-banner-ar">
              <Input
                id="free-banner-ar"
                name="bannerTextAr"
                defaultValue={initial?.bannerTextAr ?? ""}
                placeholder="التوصيل مجاني ابتداءً من 2000 دج"
                dir="rtl"
              />
            </Field>
          </div>
        </div>

        <FormMessage state={state} successLabel="Règle enregistrée." />
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </Fieldset>
    </form>
  );
}
