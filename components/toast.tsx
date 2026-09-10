"use client";

import { useEffect, useState } from "react";
import { playSfx } from "@/lib/sfx";

type Kind = "ok" | "warn" | "err";
type Toast = { id: number; text: string; kind: Kind };

let push: (item: Omit<Toast, "id">) => void = () => {};

export function toast(text: string, kind: Kind = "ok") {
  push({ text, kind });
}

export function ToastHost() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    push = ({ text, kind }) => {
      playSfx(kind);
      const id = Date.now() + Math.random();
      setItems((current) => [...current.slice(-3), { id, text, kind }]);
      window.setTimeout(() => {
        setItems((current) => current.filter((item) => item.id !== id));
      }, 3200);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-50 flex w-[min(92vw,340px)] flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className={`rounded-2xl border px-4 py-3 text-sm shadow-[var(--shadow-card)] ${
            item.kind === "ok"
              ? "border-jade/40 bg-jade text-white"
              : item.kind === "warn"
                ? "border-gold/30 bg-warning-surface text-teak"
                : "border-danger/40 bg-danger text-white"
          }`}
        >
          {item.text}
        </div>
      ))}
    </div>
  );
}
