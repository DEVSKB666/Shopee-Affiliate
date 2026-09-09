import { LiveClock } from "@/components/live-clock";
import { cn } from "@/lib/cn";

export function PageHeader({
  eyebrow,
  title,
  description,
  clock = false,
  className = "",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  clock?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-3", className)}>
      <div>
        {eyebrow ? <p className="text-xs font-semibold tracking-[0.22em] text-flame">{eyebrow}</p> : null}
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 text-sm text-mute">{description}</p> : null}
      </div>
      {clock ? <LiveClock className="text-xs text-mute" /> : null}
    </div>
  );
}
