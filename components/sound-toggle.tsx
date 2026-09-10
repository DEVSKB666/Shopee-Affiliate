"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isSfxMuted, setSfxMuted, subscribeSfx } from "@/lib/sfx";

export function SoundToggle() {
  const [muted, setMuted] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setReduced(motion.matches);
      setMuted(isSfxMuted());
    };
    sync();
    motion.addEventListener("change", sync);
    const unsubscribe = subscribeSfx(sync);
    return () => {
      motion.removeEventListener("change", sync);
      unsubscribe();
    };
  }, []);

  return (
    <button
      type="button"
      aria-pressed={muted}
      aria-label={muted ? "เปิดเสียงแจ้งเตือน" : "ปิดเสียงแจ้งเตือน"}
      title={reduced ? "ปิดเสียงแจ้งเตือนเพราะลดแอนิเมชันของระบบ" : muted ? "เปิดเสียงแจ้งเตือน" : "ปิดเสียงแจ้งเตือน"}
      disabled={reduced}
      onClick={() => {
        const next = !muted;
        setSfxMuted(next);
      }}
      className="fixed bottom-4 left-4 z-50 grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-border bg-paper-2 text-ink shadow-[var(--shadow-card)] transition duration-200 hover:bg-mist disabled:cursor-not-allowed disabled:opacity-50"
    >
      {muted ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
    </button>
  );
}
