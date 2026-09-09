"use client";

import { useEffect, useRef } from "react";

export function useLivePoll(
  callback: () => void | Promise<void>,
  ms = 8000,
  enabled = true,
) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    let timer = 0;
    let cancelled = false;

    const run = async () => {
      if (cancelled || document.hidden) return;
      await callbackRef.current();
    };

    const loop = () => {
      timer = window.setTimeout(async () => {
        await run();
        if (!cancelled) loop();
      }, ms);
    };

    const first = window.setTimeout(() => {
      void run();
      loop();
    }, 0);

    const onVisibility = () => {
      if (!document.hidden) void run();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearTimeout(first);
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, ms]);
}
