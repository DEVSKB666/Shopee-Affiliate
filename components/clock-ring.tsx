"use client";

import { formatCountdown, type DayPhaseState } from "@/lib/bangkok";

type Props = {
  phase: DayPhaseState;
  compact?: boolean;
};

export function ClockRing({ phase, compact = false }: Props) {
  const size = compact ? 132 : 188;
  const stroke = compact ? 10 : 14;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const progress =
    phase.phase === "closed"
      ? 1
      : phase.windowSeconds <= 0
        ? 0
        : Math.min(1, Math.max(0, 1 - phase.secondsLeft / phase.windowSeconds));
  const dash = circ * progress;
  const color =
    phase.phase === "closed" ? "var(--mute)" : phase.phase === "submit" ? "var(--flame)" : "var(--gold)";

  return (
    <div className="relative grid place-items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--mist)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="font-mono text-[11px] tracking-[0.18em] text-mute uppercase">
            {phase.phase === "closed" ? "CLOSED" : phase.phase === "submit" ? "SEND" : "CLICK"}
          </p>
          <p className={`font-mono font-semibold tabular-nums text-ink ${compact ? "text-lg" : "text-2xl"}`}>
            {phase.phase === "closed" ? "หมดเวลา" : formatCountdown(phase.secondsLeft)}
          </p>
          <p className="mt-1 max-w-[9rem] text-[11px] leading-snug text-mute">{phase.nextLabel}</p>
        </div>
      </div>
    </div>
  );
}
