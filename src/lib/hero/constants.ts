export const MAX_ACTIVE_HERO_SLIDES = 10;

export const HERO_LIMIT_MESSAGE_FR =
  "Vous pouvez avoir au maximum 10 diapositives actives.";

export const HERO_LIMIT_MESSAGE_AR =
  "يمكنك إضافة 10 شرائح نشطة كحد أقصى.";

export interface HeroSlideSummary {
  id: string;
  mediaId: string;
  name: string;
  url: string;
  type: "image" | "video";
  altFr: string | null;
  altAr: string | null;
  sortOrder: number;
  isActive: boolean;
}
