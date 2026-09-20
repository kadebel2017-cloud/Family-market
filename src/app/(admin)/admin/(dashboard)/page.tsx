import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  FolderTree,
  Image as ImageIcon,
  ShoppingBasket,
  Tag,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Heading,
  Text,
} from "@/components/ui";
import { requireAdmin } from "@/lib/auth/dal";
import { countAll } from "@/lib/admin/queries";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./logout-button";

export const metadata: Metadata = {
  title: "Dashboard",
};

const STATS = [
  { key: "products", label: "Produits", href: "/admin/products", icon: ShoppingBasket },
  { key: "categories", label: "Catégories", href: "/admin/categories", icon: FolderTree },
  { key: "promotions", label: "Promotions", href: "/admin/promotions", icon: Tag },
  { key: "activePromotions", label: "Promotions actives", href: "/admin/promotions", icon: Tag },
  { key: "unavailableProducts", label: "Produits indisponibles", href: "/admin/products", icon: AlertTriangle },
  { key: "media", label: "Médias", href: "/admin/media", icon: ImageIcon },
] as const;

const QUICK_ACTIONS = [
  { label: "Ajouter un produit", href: "/admin/products/new" },
  { label: "Ajouter une catégorie", href: "/admin/categories/new" },
  { label: "Ajouter une promotion", href: "/admin/promotions/new" },
  { label: "Modifier les paramètres", href: "/admin/settings" },
] as const;

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const counts = await countAll();

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Heading as="h1">Dashboard</Heading>
          <Text variant="small">
            Connecté en tant que {admin.name} ({admin.email})
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/account"
            className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5"
          >
            Compte
          </Link>
          <LogoutButton />
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.key} href={stat.href} className="group">
              <Card className="h-full transition-[border-color,box-shadow] group-hover:border-gold-500 group-hover:shadow-md">
                <CardContent className="flex items-center gap-3 pt-5">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold-50 text-gold-600 ring-1 ring-gold-200">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <Text variant="small" className="truncate text-muted-foreground">
                      {stat.label}
                    </Text>
                    <Text className="text-2xl font-bold text-foreground">
                      {counts[stat.key]}
                    </Text>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={cn(
                  "rounded-md bg-gold-500 px-4 py-2 text-sm font-medium text-white",
                  "transition-colors hover:bg-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500",
                )}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Base de données</CardTitle>
        </CardHeader>
        <CardContent>
          <Text variant="small">
            Les statistiques ci-dessus reflètent l&apos;état des données. Si la base
            est injoignable, les compteurs affichent 0 sans bloquer l&apos;espace
            d&apos;administration.
          </Text>
        </CardContent>
      </Card>
    </div>
  );
}