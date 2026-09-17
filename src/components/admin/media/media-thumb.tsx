import Image from "next/image";

import { cn } from "@/lib/utils";
import type { MediaAssetSummary, MediaType } from "@/lib/media/types";

export type MediaLike = Pick<MediaAssetSummary, "url" | "type"> & {
  name?: string;
};

export function MediaThumb({
  media,
  alt,
  className,
}: {
  media: MediaLike;
  alt?: string;
  className?: string;
}) {
  if (media.type === "video") {
    return (
      <video
        src={media.url}
        title={media.name}
        muted
        preload="metadata"
        playsInline
        className={cn("h-full w-full object-cover", className)}
        aria-label={alt}
      />
    );
  }

  return (
    <Image
      src={media.url}
      alt={alt ?? media.name ?? ""}
      width={960}
      height={720}
      unoptimized
      className={cn("h-full w-full object-cover", className)}
    />
  );
}

export function MediaTypeBadge({ type }: { type: MediaType }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        type === "image"
          ? "bg-black/75 text-white"
          : "bg-gold-500 text-white",
      )}
    >
      {type === "image" ? "Image" : "Vidéo"}
    </span>
  );
}