"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui";
import type { FormState } from "@/lib/actions/types";

export function ToggleButton({
  action,
  activeLabel,
  inactiveLabel,
  isActive,
  id,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  activeLabel: string;
  inactiveLabel: string;
  isActive: boolean;
  id: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <>
      <form action={formAction}>
        <input type="hidden" name="id" value={id} />
        <input
          type="hidden"
          name="next"
          value={isActive ? "0" : "1"}
        />
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {isActive ? inactiveLabel : activeLabel}
        </Button>
      </form>
      {state.error ? (
        <span role="alert" className="ml-2 text-xs text-red-600">
          {state.error}
        </span>
      ) : null}
    </>
  );
}