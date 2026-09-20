import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/page-header";
import { ChangePasswordForm } from "@/components/admin/account/change-password-form";
import { requireAdmin } from "@/lib/auth/dal";
import { Text } from "@/components/ui/typography";

export const metadata: Metadata = {
  title: "Compte",
};

export default async function AdminAccountPage() {
  const admin = await requireAdmin();

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8">
      <AdminPageHeader
        title="Compte"
        description="Gérez les informations de votre compte administrateur."
      />
      <div className="flex flex-col gap-2">
        <Text variant="small">
          Connecté en tant que {admin.name} ({admin.email})
        </Text>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
