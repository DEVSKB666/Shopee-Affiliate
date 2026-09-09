import type { Setting } from "@/generated/prisma/client";
import { cn } from "@/lib/cn";

export function BrandMark({
  settings,
  light = false,
  compact = false,
}: {
  settings?: Pick<Setting, "siteName" | "logoUrl"> | null;
  light?: boolean;
  compact?: boolean;
}) {
  const name = settings?.siteName || "Support Link";
  if (settings?.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={settings.logoUrl} alt={name} className={compact ? "h-8" : "h-10"} />
    );
  }

  const [first, ...rest] = name.split(" ");
  return (
    <div className="flex items-baseline gap-1.5">
      <span
        className={cn(
          "font-semibold tracking-tight",
          compact ? "text-lg" : "text-2xl",
          light ? "text-white" : "text-ink",
        )}
      >
        {first}
      </span>
      {rest.length ? (
        <span
          className={cn(
            "font-semibold",
            compact ? "text-lg" : "text-2xl",
            light ? "text-gold" : "text-flame",
          )}
        >
          {rest.join(" ")}
        </span>
      ) : null}
    </div>
  );
}
