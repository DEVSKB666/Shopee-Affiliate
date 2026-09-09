"use client";

import { useEffect, useState } from "react";

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    let interval = 0;
    const tick = () => setNow(new Date());
    const start = () => {
      tick();
      window.clearInterval(interval);
      interval = window.setInterval(tick, intervalMs);
    };
    const onVisibility = () => {
      if (document.hidden) window.clearInterval(interval);
      else start();
    };

    const first = window.setTimeout(start, 0);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs]);

  return now;
}
