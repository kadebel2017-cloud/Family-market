import { Badge } from "@/components/ui";
import type { StatusTone } from "@/lib/admin/format";

const toneClasses: Record<StatusTone, string> = {
  success: "bg-emerald-600 text-white",
  warning: "bg-amber-500 text-white",
  danger: "bg-red-600 text-white",
  neutral: "bg-black/10 text-foreground",
};

export function StatusBadge({
  tone = "neutral",
  children,
}: {
  tone?: StatusTone;
  children: React.ReactNode;
}) {
  return (
    <Badge variant="outline" className={toneClasses[tone]}>
      {children}
    </Badge>
  );
}