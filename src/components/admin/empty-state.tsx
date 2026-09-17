import { Text } from "@/components/ui";

export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-black/15 px-6 py-14 text-center">
      <Text className="font-semibold text-foreground">{title}</Text>
      {description ? (
        <Text className="mt-1 text-sm text-muted-foreground">{description}</Text>
      ) : null}
      {children ? <div className="mt-4 flex justify-center">{children}</div> : null}
    </div>
  );
}