import { DashboardNav } from "@/components/layout/dashboard-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1">
      <DashboardNav />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}