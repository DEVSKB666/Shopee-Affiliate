import { cn } from "@/lib/cn";

type Tone = "jade" | "gold" | "flame" | "sky" | "mute";

export function Chip({
  children,
  icon,
  tone = "mute",
  className = "",
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  const tones: Record<Tone, string> = {
    jade: "bg-jade/10 text-jade",
    gold: "bg-gold/25 text-ink",
    flame: "bg-flame/10 text-flame",
    sky: "bg-sky/10 text-sky",
    mute: "bg-mist text-mute",
  };

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", tones[tone], className)}>
      {icon}
      {children}
    </span>
  );
}
