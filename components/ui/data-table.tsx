import { cn } from "@/lib/cn";

export function TableShell({
  children,
  caption,
  className = "",
}: {
  children: React.ReactNode;
  caption: string;
  className?: string;
}) {
  return (
    <div className={cn("max-h-[70vh] overflow-auto rounded-2xl border border-border", className)}>
      <table className="admin-table">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}
