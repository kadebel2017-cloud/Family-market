import {
  FolderTree,
  Image as ImageIcon,
  KeyRound,
  LayoutDashboard,
  Settings,
  ShoppingBasket,
  Tag,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const ADMIN_NAV = [
  { label: "Vue d'ensemble", href: "/admin", icon: LayoutDashboard },
  { label: "Produits", href: "/admin/products", icon: ShoppingBasket },
  { label: "Catégories", href: "/admin/categories", icon: FolderTree },
  { label: "Promotions", href: "/admin/promotions", icon: Tag },
  { label: "Médias", href: "/admin/media", icon: ImageIcon },
  { label: "Paramètres", href: "/admin/settings", icon: Settings },
  { label: "Compte", href: "/admin/account", icon: KeyRound },
] satisfies AdminNavItem[];
