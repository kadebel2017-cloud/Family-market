import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/page-header";
import { MediaGallery } from "@/components/admin/media/media-gallery";
import { requireAdmin } from "@/lib/auth/dal";
import { listMediaSummaries } from "@/lib/admin/queries";

export const metadata: Metadata = {
  title: "Médias",
};

export default async function AdminMediaPage() {
  await requireAdmin();
  const media = await listMediaSummaries();

  return (
    <div className="flex flex-1 flex-col">
      <AdminPageHeader
        title="Médias"
        description="Envoyez et gérez les images et vidéos utilisées sur le site."
      />
      <MediaGallery initialMedia={media} />
    </div>
  );
}