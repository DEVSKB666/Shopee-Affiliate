"use client";

export function AnimatedList({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="animated-list space-y-2">{children}</div>;
}
