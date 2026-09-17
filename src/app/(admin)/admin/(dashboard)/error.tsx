"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <AlertTriangle className="h-12 w-12 text-red-600" aria-hidden />
      <h1 className="text-2xl font-bold text-foreground">Une erreur est survenue</h1>
      <p className="text-sm text-muted-foreground">
        Le contenu n&apos;a pas pu être chargé. Veuillez réessayer.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Réessayer
        </button>
        <Link
          href="/admin"
          className="inline-flex h-10 items-center justify-center rounded-md border border-black/15 bg-white px-5 text-sm font-semibold text-foreground transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}