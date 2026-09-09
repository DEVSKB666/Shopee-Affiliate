"use client";

import { cn } from "@/lib/cn";
import { playSfx } from "@/lib/sfx";

export type IconTabItem<T extends string> = {
  id: T;
  label: string;
  icon: React.ReactNode;
};

export function IconTabBar<T extends string>({
  items,
  value,
  onChange,
}: {
  items: IconTabItem<T>[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <nav className="flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            playSfx("click");
            onChange(item.id);
          }}
          className={cn(
            "inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 text-sm transition duration-200",
            value === item.id ? "bg-flame text-white" : "bg-paper-2 text-ink hover:bg-mist",
          )}
        >
          <span aria-hidden>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
