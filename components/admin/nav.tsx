"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";
import { ClipboardList, LayoutDashboard, Receipt, Settings, Users } from "lucide-react";

const LINKS: { href: string; label: string; exact?: boolean; icon: ReactNode }[] = [
  { href: "/admin", label: "ภาพรวม", exact: true, icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/admin/members", label: "สมาชิก", icon: <Users className="h-4 w-4" /> },
  { href: "/admin/payments", label: "สลิป", icon: <Receipt className="h-4 w-4" /> },
  { href: "/admin/late", label: "งานค้าง", icon: <ClipboardList className="h-4 w-4" /> },
  { href: "/admin/settings", label: "ตั้งค่า", icon: <Settings className="h-4 w-4" /> },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav({ compact = false, role }: { compact?: boolean; role?: "ADMIN" | "MODERATOR" | "MEMBER" }) {
  const pathname = usePathname();
  const links = role === "ADMIN" ? LINKS : LINKS.filter((item) => item.href !== "/admin/settings");

  if (compact) {
    return (
      <div className="mb-4 flex gap-2 overflow-x-auto lg:hidden">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs transition duration-200",
              isActive(pathname, item.href, item.exact)
                ? "border-flame bg-flame text-white"
                : "border-border bg-paper-2 text-ink hover:bg-mist",
            )}
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <nav className="mt-6 space-y-1">
      {links.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex min-h-11 items-center gap-2 rounded-2xl px-3 text-sm transition duration-200",
            isActive(pathname, item.href, item.exact)
              ? "bg-flame/15 font-semibold text-flame"
              : "text-mute hover:bg-mist hover:text-ink",
          )}
        >
          <span aria-hidden>{item.icon}</span>
          {item.label}
        </Link>
      ))}
      <Link href="/app" className="flex min-h-11 items-center rounded-2xl px-3 text-sm text-mute hover:bg-mist hover:text-ink">
        หน้าสมาชิก
      </Link>
      <div className="pt-3">
        <SignOutButton />
      </div>
    </nav>
  );
}
