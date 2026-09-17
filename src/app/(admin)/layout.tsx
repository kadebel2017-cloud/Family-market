import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The admin UI is French-only, so force LTR even when the visitor's
  // public locale cookie is Arabic (which sets `dir="rtl"` on <html>).
  return (
    <div dir="ltr" className="flex min-h-full flex-1 flex-col">
      {children}
    </div>
  );
}