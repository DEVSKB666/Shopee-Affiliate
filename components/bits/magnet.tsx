"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";

export function Magnet({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(event: React.MouseEvent<HTMLDivElement>) {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    const box = ref.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) * 0.18;
    const y = (event.clientY - rect.top - rect.height / 2) * 0.18;
    box.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  function onLeave() {
    const box = ref.current;
    if (!box) return;
    box.style.transform = "translate3d(0, 0, 0)";
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn("transition-transform duration-200 will-change-transform", className)}
    >
      {children}
    </div>
  );
}
