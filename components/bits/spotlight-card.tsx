"use client";

import { useRef } from "react";

export function SpotlightCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      onMouseMove={(event) => {
        const box = ref.current;
        if (!box) return;
        const rect = box.getBoundingClientRect();
        box.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
        box.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
      }}
      className={`spotlight-card rounded-3xl border border-border bg-paper-2 p-5 shadow-[var(--shadow-card)] ${className}`}
    >
      {children}
    </div>
  );
}
