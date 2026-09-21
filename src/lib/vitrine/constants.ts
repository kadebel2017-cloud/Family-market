export const MAX_ACTIVE_VITRINE_SLIDES = 10;

export const VITRINE_LIMIT_MESSAGE_FR =
  "Vous pouvez avoir au maximum 10 photos Vitrine actives.";

export const VITRINE_LIMIT_MESSAGE_AR =
  "يمكنك إضافة 10 صور عرض نشطة كحد أقصى.";

export interface VitrineSlideSummary {
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
