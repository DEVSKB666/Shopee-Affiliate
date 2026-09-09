import { cn } from "@/lib/cn";

export function GradientText({
  children,
  className = "",
  as: Tag = "span",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "span" | "h1" | "h2" | "p";
}) {
  return <Tag className={cn("gradient-text", className)}>{children}</Tag>;
}
