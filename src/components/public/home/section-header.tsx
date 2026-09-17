import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeader({
  title,
  action,
  id,
}: {
  title: string;
  action?: { label: string; href: string };
  id?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span aria-hidden className="h-6 w-1 rounded-full bg-gold-500" />
        <h2
          id={id}
          className="text-xl font-bold text-foreground sm:text-2xl"
        >
          {title}
        </h2>
      </div>
      {action ? (
        <Link
          href={action.href}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-600 transition-colors hover:text-gold-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-md"
        >
          {action.label}
          <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}