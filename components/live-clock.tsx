"use client";

import { formatBangkokClock } from "@/lib/bangkok";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/cn";

export function LiveClock({ className = "" }: { className?: string }) {
  const now = useNow();

  return (
    <span className={cn("inline-flex items-center gap-1.5 font-mono tabular-nums", className)}>
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-jade" />
      {now ? formatBangkokClock(now) : "--:--:--"}
    </span>
  );
}
