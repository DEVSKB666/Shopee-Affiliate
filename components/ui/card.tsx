import { cn } from "@/lib/cn";

export function Card({
  children,
  className = "",
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-border bg-paper-2 shadow-[var(--shadow-card)]",
        padded && "p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}
