import Link from "next/link";
import { auth } from "@/auth";
import { BrandMark } from "@/components/brand";
import { Aurora } from "@/components/bits/aurora";
import { SignOutButton } from "@/components/sign-out-button";
import { EmptyState } from "@/components/ui/empty-state";
import { getSettings } from "@/lib/session";
import { PauseCircle, Timer, UserRound, Wallet } from "lucide-react";

export default async function PendingPage() {
  const session = await auth();
  const settings = await getSettings();
  const status = session?.user.status;
  const paused = status === "INACTIVE";

  return (
    <div className="relative min-h-full overflow-hidden bg-canvas">
      <Aurora />
      <div className="relative mx-auto flex min-h-full max-w-lg flex-col justify-center px-5 py-12">
        <BrandMark settings={settings} />
        <EmptyState
          className="mt-8"
          icon={paused ? <PauseCircle className="h-6 w-6" /> : <Timer className="h-6 w-6" />}
          title={paused ? "ไอดีถูกพัก" : "รอเปิดระบบ"}
          body={paused ? "แอดมินระงับไอดีนี้ชั่วคราว มักเพราะค้างกดหรือยังไม่ต่ออายุ" : settings.contactNote}
          action={
            <div className="flex flex-col gap-3">
              <Link
                href="/app/pay"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-jade text-sm font-semibold text-white"
              >
                <Wallet className="h-4 w-4" aria-hidden />
                ไปหน้าแจ้งโอน
              </Link>
              <Link
                href="/app/profile"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-paper-2 text-sm font-semibold"
              >
                <UserRound className="h-4 w-4" aria-hidden />
                แก้โปรไฟล์
              </Link>
              <SignOutButton />
            </div>
          }
        />
      </div>
    </div>
  );
}
