"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { SoundToggle } from "@/components/sound-toggle";
import { ToastHost } from "@/components/toast";
import { unlockSfx } from "@/lib/sfx";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const unlock = () => unlockSfx();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  return (
    <SessionProvider>
      {children}
      <ToastHost />
      <SoundToggle />
    </SessionProvider>
  );
}
