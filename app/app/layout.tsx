import Link from "next/link";
import { auth } from "@/auth";
import { BrandMark } from "@/components/brand";
import { ContactFloat } from "@/components/contact-float";
import { LiveClock } from "@/components/live-clock";
import { SignOutButton } from "@/components/sign-out-button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/session";
import { Shield, Wallet } from "lucide-react";

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const settings = await getSettings();
  const me = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { displayName: true, avatarUrl: true },
      })
    : null;

  return (
    <div className="min-h-full">
      {settings.announcement ? (
        <div className="bg-flame px-4 py-2 text-center text-sm text-white">{settings.announcement}</div>
      ) : null}
      <header className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-4 pt-5">
        <Link href="/app">
          <BrandMark settings={settings} compact />
        </Link>
        <div className="flex items-center gap-2">
          <LiveClock className="mr-1 hidden text-[11px] text-mute sm:inline-flex" />
          {session?.user.role === "ADMIN" ? (
            <Link
              href="/admin"
              className="inline-flex min-h-11 items-center gap-1 rounded-full bg-flame px-3 text-xs text-white"
            >
              <Shield className="h-3.5 w-3.5" aria-hidden />
              แอดมิน
            </Link>
          ) : null}
          <Link
            href="/app/profile"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-paper-2 px-2 pr-3 text-xs"
          >
            <UserAvatar name={me?.displayName || session?.user.name || "สมาชิก"} src={me?.avatarUrl} size="sm" />
            โปรไฟล์
          </Link>
          <Link
            href="/app/pay"
            className="inline-flex min-h-11 items-center gap-1 rounded-full border border-border bg-paper-2 px-3 text-xs"
          >
            <Wallet className="h-3.5 w-3.5" aria-hidden />
            โอนเงิน
          </Link>
          <SignOutButton />
        </div>
      </header>
      {children}
      <ContactFloat href={settings.adminFacebook} />
    </div>
  );
}
