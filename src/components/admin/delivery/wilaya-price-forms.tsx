"use client";

import { useActionState, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button, Input } from "@/components/ui";
import { Checkbox, Field, Fieldset } from "@/components/admin/fields";
import { FormMessage } from "@/components/admin/form-message";
import { ALGERIA_WILAYAS } from "@/data/algeria-wilayas";
import type { FormState, MutationAction } from "@/lib/actions/types";
import { cn } from "@/lib/utils";

export interface WilayaPriceRow {
  id: string;
  wilayaCode: string;
  wilayaName: string;
  homePrice: string;
  officePrice: string;
  isActive: boolean;
}

export function WilayaPriceNewForm({ action }: { action: MutationAction }) {
  const [state, formAction, pending] = useActionState(action, {} as FormState);

  return (
    <form action={formAction}>
      <Fieldset
        legend="Ajouter une wilaya"
        description="Seules les wilayas avec un prix actif peuvent être commandées. Aucun prix n'est inventé : chaque wilaya doit être ajoutée ici."
        icon={Plus}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Wilaya" htmlFor="new-wilayaCode">
            <select
              id="new-wilayaCode"
              name="wilayaCode"
              required
              defaultValue="31"
              className="flex h-11 w-full rounded-md border border-black/15 bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            >
              {ALGERIA_WILAYAS.map((wilaya) => (
                <option key={wilaya.code} value={wilaya.code}>
                  {wilaya.code} — {wilaya.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Prix à domicile (DA)" htmlFor="new-homePrice">
            <Input
              id="new-homePrice"
              name="homePrice"
              required
              inputMode="decimal"
              defaultValue="1000"
              placeholder="1000"
            />
          </Field>
          <Field label="Prix au bureau (DA)" htmlFor="new-officePrice">
            <Input
              id="new-officePrice"
              name="officePrice"
              required
              inputMode="decimal"
              defaultValue="600"
              placeholder="600"
            />
          </Field>
          <Field label="Statut">
            <label className="flex h-11 items-center gap-2 text-sm">
              <Checkbox name="isActive" defaultChecked />
              Prix actif
            </label>
          </Field>
        </div>
        <FormMessage state={state} successLabel="Prix enregistré." />
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer le prix"}
          </Button>
        </div>
      </Fieldset>
    </form>
  );
}

export function WilayaPriceRowCard({
  row,
  updateAction,
  toggleAction,
  deleteAction,
}: {
  row: WilayaPriceRow;
  updateAction: MutationAction;
  toggleAction: MutationAction;
  deleteAction: MutationAction;
}) {
  const [updateState, updateFormAction, updatePending] = useActionState(
    updateAction,
    {} as FormState,
  );
  const [toggleState, toggleFormAction, togglePending] = useActionState(
    toggleAction,
    {} as FormState,
  );
  const [deleteState, deleteFormAction, deletePending] = useActionState(
    deleteAction,
    {} as FormState,
  );
  const [editing, setEditing] = useState(false);

  return (
    <div
      className={cn(
        "rounded-lg border bg-surface p-5 shadow-sm",
        row.isActive ? "border-black/10" : "border-black/10 opacity-70",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">
          {row.wilayaCode} — {row.wilayaName}{" "}
          <span
            className={cn(
              "ms-1 rounded-full px-2 py-0.5 text-xs font-semibold",
              row.isActive
                ? "bg-emerald-100 text-emerald-800"
                : "bg-black/10 text-muted-foreground",
            )}
          >
            {row.isActive ? "Actif" : "Désactivé"}
          </span>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing((value) => !value)}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-black/15 px-3 text-sm font-medium transition-colors hover:bg-black/5"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            {editing ? "Fermer" : "Modifier"}
          </button>
          <form action={toggleFormAction}>
            <input type="hidden" name="id" value={row.id} />
            <input type="hidden" name="active" value={row.isActive ? "1" : "0"} />
            <Button type="submit" variant="outline" size="sm" disabled={togglePending}>
              {row.isActive ? "Désactiver" : "Activer"}
            </Button>
          </form>
          <form action={deleteFormAction}>
            <input type="hidden" name="id" value={row.id} />
            <Button type="submit" variant="danger" size="sm" disabled={deletePending} title="Supprimer">
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </form>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Domicile</dt>
          <dd className="font-semibold text-foreground">{row.homePrice} DA</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Bureau</dt>
          <dd className="font-semibold text-foreground">{row.officePrice} DA</dd>
        </div>
      </dl>

      {toggleState.error || deleteState.error ? (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {toggleState.error ?? deleteState.error}
        </p>
      ) : null}

      {editing ? (
        <form action={updateFormAction} className="mt-4 space-y-4 border-t border-black/10 pt-4">
          <input type="hidden" name="wilayaCode" value={row.wilayaCode} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Prix à domicile (DA)" htmlFor={`home-${row.id}`}>
              <Input
                id={`home-${row.id}`}
                name="homePrice"
                required
                inputMode="decimal"
                defaultValue={row.homePrice}
              />
            </Field>
            <Field label="Prix au bureau (DA)" htmlFor={`office-${row.id}`}>
              <Input
                id={`office-${row.id}`}
                name="officePrice"
                required
                inputMode="decimal"
                defaultValue={row.officePrice}
              />
            </Field>
            <Field label="Statut">
              <label className="flex h-11 items-center gap-2 text-sm">
                <Checkbox name="isActive" defaultChecked={row.isActive} />
                Prix actif
              </label>
            </Field>
          </div>
          <FormMessage state={updateState} successLabel="Prix mis à jour." />
          <div className="flex justify-end">
            <Button type="submit" disabled={updatePending}>
              {updatePending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
