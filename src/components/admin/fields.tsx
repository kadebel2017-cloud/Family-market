import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-foreground"
      >
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      className="flex min-h-[96px] w-full rounded-md border border-black/15 bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 disabled:cursor-not-allowed disabled:opacity-50"
      {...props}
    />
  );
}

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement>,
) {
  return (
    <select
      className="flex h-11 w-full rounded-md border border-black/15 bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 disabled:cursor-not-allowed disabled:opacity-50"
      {...props}
    />
  );
}

export function Checkbox(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className="h-4 w-4 rounded border-black/20 accent-gold-500"
      {...props}
    />
  );
}

export function Fieldset({
  legend,
  description,
  icon: Icon,
  children,
}: {
  legend: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-4 rounded-lg border border-black/10 bg-surface p-5 shadow-sm">
      <legend className="flex items-center gap-2 px-1 text-sm font-semibold text-foreground">
        {Icon ? (
          <Icon className="h-4 w-4 text-gold-600" aria-hidden />
        ) : null}
        {legend}
      </legend>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}