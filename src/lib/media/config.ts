export const MEDIA_CATEGORIES = [
  "PRODUCT",
  "CATEGORY",
  "PROMOTION",
  "HERO",
  "VITRINE",
  "STORE",
  "LOGO",
  "OTHER",
] as const;

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export const ALLOWED_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".avif",
] as const;

export const ALLOWED_VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov"] as const;

export const BLOB_BASE_FOLDER = "media";