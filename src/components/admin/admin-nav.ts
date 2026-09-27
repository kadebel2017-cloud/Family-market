import {
  ClipboardList,
  FolderTree,
  Image as ImageIcon,
  KeyRound,
  LayoutDashboard,
  Settings,
  ShoppingBasket,
  Tag,
  Truck,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  iconClassName: string;
}

export const ADMIN_NAV = [
  { label: "Vue d'ensemble", href: "/admin", icon: LayoutDashboard, iconClassName: "text-sky-600" },
  { label: "Promotions", href: "/admin/promotions", icon: Tag, iconClassName: "text-rose-500" },
  { label: "Produits", href: "/admin/products", icon: ShoppingBasket, iconClassName: "text-emerald-600" },
  { label: "Catégories", href: "/admin/categories", icon: FolderTree, iconClassName: "text-amber-600" },
  { label: "Commandes", href: "/admin/orders", icon: ClipboardList, iconClassName: "text-violet-600" },
  { label: "Livraison", href: "/admin/delivery", icon: Truck, iconClassName: "text-orange-600" },
  { label: "Médias", href: "/admin/media", icon: ImageIcon, iconClassName: "text-cyan-600" },
  { label: "Paramètres", href: "/admin/settings", icon: Settings, iconClassName: "text-slate-500" },
  { label: "Compte", href: "/admin/account", icon: KeyRound, iconClassName: "text-indigo-500" },
] satisfies AdminNavItem[];
