export interface FormState {
  ok?: boolean;
  error?: string;
}

export const INITIAL_FORM_STATE: FormState = {};

// Server action used with useActionState: (previousState, formData) => state.
export type MutationAction = (
  prev: FormState,
  formData: FormData,
) => Promise<FormState>;