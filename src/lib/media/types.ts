export type MediaType = "image" | "video";

export type MediaCategory =
  | "PRODUCT"
  | "CATEGORY"
  | "PROMOTION"
  | "HERO"
  | "VITRINE"
  | "STORE"
  | "LOGO"
  | "OTHER";

export interface MediaAssetSummary {
  id: string;
  name: string;
  url: string;
  type: MediaType;
  mimeType: string | null;
  size: number | null;
  category: MediaCategory;
  altFr: string | null;
  altAr: string | null;
  createdAt: string;
}

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  image: "Image",
  video: "Vidéo",
};

export const MEDIA_CATEGORY_LABELS: Record<MediaCategory, string> = {
  PRODUCT: "Produit",
  CATEGORY: "Catégorie",
  PROMOTION: "Promotion",
  HERO: "Hero",
  VITRINE: "Vitrine",
  STORE: "Boutique",
  LOGO: "Logo",
  OTHER: "Autre",
};

export const MEDIA_CATEGORY_OPTIONS: {
  value: MediaCategory;
  label: string;
}[] = [
  { value: "PRODUCT", label: "Produit" },
  { value: "CATEGORY", label: "Catégorie" },
  { value: "PROMOTION", label: "Promotion" },
  { value: "HERO", label: "Hero" },
  { value: "VITRINE", label: "Vitrine" },
  { value: "STORE", label: "Boutique" },
  { value: "LOGO", label: "Logo" },
  { value: "OTHER", label: "Autre" },
];

export function formatMediaSize(bytes: number | null): string {
  if (bytes === null || bytes < 0) {
    return "—";
  }
  if (bytes < 1024) {
    return `${bytes} o`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} Ko`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}