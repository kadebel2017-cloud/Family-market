"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui";
import type { FormState } from "@/lib/actions/types";

export function DeleteConfirmButton({
  action,
  id,
  confirmLabel = "Confirmer la suppression ?",
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  id: string;
  confirmLabel?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(action, {});

  if (confirming) {
    return (
      <form action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="id" value={id} />
        <Button type="submit" variant="danger" size="sm" disabled={pending}>
          {pending ? "Suppression…" : "Confirmer"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => setConfirming(false)}
        >
          Annuler
        </Button>
      </form>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label={confirmLabel}
        onClick={() => setConfirming(true)}
      >
        Supprimer
      </Button>
      {state.error ? (
        <span role="alert" className="ml-2 text-xs text-red-600">
          {state.error}
        </span>
      ) : null}
    </>
  );
}