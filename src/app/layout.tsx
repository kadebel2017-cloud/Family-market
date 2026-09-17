import type { Metadata } from "next";
import { Noto_Sans, Noto_Sans_Arabic } from "next/font/google";
import { getLocale } from "@/lib/i18n/locale";
import { SITE_URL } from "@/lib/public/site";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin", "latin-ext"],
});

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-noto-sans-arabic",
  subsets: ["arabic"],
});

export const metadata: Metadata = {
  title: {
    default: "Family Market",
    template: "%s | Family Market",
  },
  description:
    "Family Market — site officiel du supermarché. Produits, catégories, promotions et horaires d'ouverture.",
  applicationName: "Family Market",
  authors: [{ name: "Family Market" }],
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "Family Market",
    description: "Site officiel du supermarché Family Market.",
    siteName: "Family Market",
    locale: "fr_FR",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${notoSans.variable} ${notoSansArabic.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}