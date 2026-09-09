import { MessageCircle } from "lucide-react";

export function ContactFloat({ href }: { href?: string | null }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="fixed right-5 bottom-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-sky text-white shadow-[0_12px_30px_rgba(37,99,235,0.28)]"
      aria-label="ติดต่อแอดมิน"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
