import type { FormState } from "@/lib/actions/types";

export function FormMessage({
  state,
  successLabel = "Enregistré avec succès.",
}: {
  state: FormState;
  successLabel?: string;
}) {
  if (state.error) {
    return (
      <div
        role="alert"
        className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {state.error}
      </div>
    );
  }
  if (state.ok) {
    return (
      <div
        role="status"
        className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
      >
        {successLabel}
      </div>
    );
  }
  return null;
}
