"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";

export function ClickSpark({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  function spark(event: React.MouseEvent<HTMLSpanElement>) {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    const host = ref.current;
    if (!host) return;
    const rect = host.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    for (let i = 0; i < 8; i += 1) {
      const dot = document.createElement("span");
      const angle = (Math.PI * 2 * i) / 8;
      dot.className = "pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-gold";
      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;
      host.appendChild(dot);
      const anim = dot.animate(
        [
          { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
          {
            transform: `translate(calc(-50% + ${Math.cos(angle) * 18}px), calc(-50% + ${Math.sin(angle) * 18}px)) scale(0)`,
            opacity: 0,
          },
        ],
        { duration: 420, easing: "ease-out" },
      );
      anim.onfinish = () => dot.remove();
    }
  }

  return (
    <span ref={ref} onClick={spark} className={cn("relative inline-flex overflow-hidden", className)}>
      {children}
    </span>
  );
}
