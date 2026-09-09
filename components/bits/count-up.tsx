"use client";

import { useEffect, useRef, useState } from "react";

export function CountUp({
  to,
  className = "",
}: {
  to: number;
  className?: string;
}) {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    if (from === to) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) {
      const id = window.requestAnimationFrame(() => {
        fromRef.current = to;
        setValue(to);
      });
      return () => window.cancelAnimationFrame(id);
    }

    const start = performance.now();
    const duration = 500;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const next = Math.round(from + (to - from) * (1 - Math.pow(1 - progress, 3)));
      setValue(next);
      if (progress < 1) frame = window.requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [to]);

  return <span className={className}>{value}</span>;
}
