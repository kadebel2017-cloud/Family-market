"use client";

import { useActionState, useState } from "react";
import { Truck } from "lucide-react";

import { Button } from "@/components/ui";
import { Checkbox, Field, Fieldset } from "@/components/admin/fields";
import { FormMessage } from "@/components/admin/form-message";
import type { FormState, MutationAction } from "@/lib/actions/types";

export function DeliverySettingsForm({
  action,
  initialEnabled,
}: {
  action: MutationAction;
  initialEnabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {} as FormState);
  const [enabled, setEnabled] = useState(initialEnabled);

  return (
    <form action={formAction}>
      <Fieldset
        legend="Service de livraison"
        description="Si désactivé, la livraison est temporairement indisponible pour les clients."
        icon={Truck}
      >
        <Field label="Service de livraison">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              name="deliveryEnabled"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
            />
            {enabled ? "ON — service activé" : "OFF — service désactivé"}
          </label>
        </Field>
        <FormMessage state={state} successLabel="Paramètre enregistré." />
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </Fieldset>
    </form>
  );
}
