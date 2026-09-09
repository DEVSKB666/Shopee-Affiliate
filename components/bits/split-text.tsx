"use client";

import { useEffect, useState } from "react";

export function SplitText({
  text,
  className = "",
  as: Tag = "h1",
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "p";
}) {
  const words = (text || "").split(" ").filter(Boolean);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <Tag className={className}>
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className="inline-block pr-[0.3em] transition-all duration-700"
          style={{
            opacity: ready ? 1 : 0,
            transform: ready ? "translateY(0)" : "translateY(16px)",
            transitionDelay: `${index * 70}ms`,
          }}
        >
          {word}
        </span>
      ))}
    </Tag>
  );
}
