import { Heading, Text } from "@/components/ui";

export function AdminPageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <Heading as="h1" className="text-2xl">
          {title}
        </Heading>
        {description ? (
          <Text className="text-sm text-muted-foreground">{description}</Text>
        ) : null}
      </div>
      {children ? <div className="flex items-center gap-3">{children}</div> : null}
    </div>
  );
}