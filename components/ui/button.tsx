"use client";

import type { ButtonHTMLAttributes } from "react";
import { ClickSpark } from "@/components/bits/click-spark";
import { cn } from "@/lib/cn";
import { playSfx } from "@/lib/sfx";

type Tone = "primary" | "ghost" | "danger" | "danger-ghost" | "jade" | "sky" | "gold";
type Size = "md" | "sm" | "icon";

export function Button({
  children,
  className = "",
  tone = "primary",
  size = "md",
  icon,
  spark = false,
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: Tone;
  size?: Size;
  icon?: React.ReactNode;
  spark?: boolean;
}) {
  const tones: Record<Tone, string> = {
    primary: "bg-flame text-white hover:bg-flame-deep",
    ghost: "bg-paper-2 text-ink border border-border hover:bg-mist",
    danger: "bg-flame text-white hover:bg-flame-deep",
    "danger-ghost": "border border-flame/50 bg-flame/10 text-flame hover:bg-flame hover:text-white",
    jade: "bg-jade text-white hover:opacity-90",
    sky: "bg-sky text-white hover:opacity-90",
    gold: "bg-gold text-teak hover:opacity-90",
  };
  const sizes: Record<Size, string> = {
    md: "min-h-11 px-4 text-sm",
    sm: "min-h-10 px-3 text-xs",
    icon: "h-10 w-10 min-h-10 px-0",
  };

  const button = (
    <button
      {...props}
      onClick={(event) => {
        playSfx("click");
        onClick?.(event);
      }}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        tones[tone],
        sizes[size],
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );

  if (!spark) return button;
  return <ClickSpark className="w-full">{button}</ClickSpark>;
}
