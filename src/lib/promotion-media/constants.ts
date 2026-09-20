export const MAX_ACTIVE_PROMOTION_SLIDES = 10;

export const PROMOTION_LIMIT_MESSAGE_FR =
  "Vous pouvez avoir au maximum 10 médias actifs par promotion.";

export const PROMOTION_LIMIT_MESSAGE_AR =
  "يمكنك إضافة 10 وسائط نشطة كحد أقصى لكل عرض.";

export interface PromotionSlideSummary {
  id: string;
  promotionId: string;
  mediaId: string;
  name: string;
  url: string;
  type: "image" | "video";
  altFr: string | null;
  altAr: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface PromotionSlidePublic {
  id: string;
  mediaId: string;
  name: string;
  url: string;
  type: "image" | "video";
  altFr: string | null;
  altAr: string | null;
  sortOrder: number;
}
