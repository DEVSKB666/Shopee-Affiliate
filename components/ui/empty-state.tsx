import { cn } from "@/lib/cn";

export function EmptyState({
  icon,
  title,
  body,
  action,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-3xl border border-border bg-paper-2 px-6 py-10 text-center", className)}>
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-canvas text-flame">{icon}</div>
      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
      {body ? <p className="mt-2 text-sm leading-6 text-mute">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
