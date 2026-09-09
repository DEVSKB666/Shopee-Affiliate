"use client";

import { useState, useTransition } from "react";
import { getPaymentLiveState, submitPayment } from "@/actions/member";
import { toast } from "@/components/toast";
import { AnimatedList } from "@/components/bits/animated-list";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { PageHeader } from "@/components/ui/page-header";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ImageUpload } from "@/components/ui/image-upload";
import { useLivePoll } from "@/hooks/use-live-poll";
import { thaiMonthLabel } from "@/lib/bangkok";
import type { getPaymentBoard } from "@/lib/queries";
import { CircleCheck, Clock3, CircleX, Upload, Wallet } from "lucide-react";

type Board = NonNullable<Awaited<ReturnType<typeof getPaymentBoard>>>;

export function PaymentBoard({ board: initial }: { board: Board }) {
  const [board, setBoard] = useState(initial);
  const mine = board.rows.find((row) => row.userId === board.currentUserId);
  const [pending, start] = useTransition();
  const required = board.settings.requirePayment;

  useLivePoll(async () => {
    const next = await getPaymentLiveState(board.monthKey);
    if (next) setBoard(next);
  }, 8000);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6">
      <Card className="p-6">
        <PageHeader
          eyebrow="MONTHLY"
          title={`แจ้งโอนรอบ ${thaiMonthLabel(board.monthKey)}`}
          description={required ? "ต้องโอนก่อนถึงจะใช้ระบบได้" : "โอนเป็นทางเลือก ตอนนี้ใช้ระบบได้โดยไม่ต้องจ่ายก่อน"}
        />
        <div className="mt-5 rounded-[24px] bg-sky/10 p-5 text-center">
          {board.settings.qrImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={board.settings.qrImageUrl} alt="QR โอนเงิน" className="mx-auto mb-3 h-40 w-40 object-contain" />
          ) : null}
          <p className="font-mono text-2xl tracking-wider">{board.settings.bankAccount}</p>
          <p className="mt-1 font-medium">{board.settings.bankName}</p>
          <p className="text-sm text-mute">{board.settings.accountName}</p>
          <Chip tone="jade" icon={<Wallet className="h-3.5 w-3.5" aria-hidden />} className="mt-3">
            {board.settings.fee}.- / เดือน
          </Chip>
        </div>

        {mine ? (
          <div className="mt-6 rounded-[24px] bg-canvas p-4">
            <p className="font-semibold">สถานะของคุณ</p>
            <p className="mt-1 text-sm text-mute">
              {mine.payment?.status === "APPROVED"
                ? "ยืนยันแล้วสำหรับรอบนี้"
                : mine.payment?.status === "PENDING"
                  ? "รอแอดมินตรวจสลิป"
                  : "ยังไม่แจ้งโอน"}
            </p>
            {mine.payment?.status !== "APPROVED" ? (
              <form
                className="mt-4 space-y-3"
                action={(formData) => {
                  start(async () => {
                    const result = await submitPayment(formData);
                    toast(result.message, result.ok ? "ok" : "err");
                    if (result.ok) {
                      const next = await getPaymentLiveState(board.monthKey);
                      if (next) setBoard(next);
                    }
                  });
                }}
              >
                <input type="hidden" name="monthKey" value={board.monthKey} />
                <ImageUpload name="slip" label="สลิปโอนเงิน" required disabled={pending} />
                <Button type="submit" tone="jade" className="w-full" disabled={pending} icon={<Upload className="h-4 w-4" aria-hidden />}>
                  {pending ? "กำลังส่ง..." : "ส่งสลิป"}
                </Button>
              </form>
            ) : null}
          </div>
        ) : null}
      </Card>

      <Card className="mt-4">
        <h2 className="text-lg font-semibold">บอร์ดทั้งกลุ่ม</h2>
        <div className="mt-4">
          <AnimatedList>
            {board.rows.map((row) => (
              <div key={row.userId} className="flex items-center justify-between gap-3 rounded-2xl bg-canvas px-3 py-3">
                <span className="flex min-w-0 items-center gap-3">
                  <UserAvatar name={row.displayName} src={row.avatarUrl} size="sm" />
                  <span className="truncate">{row.displayName}</span>
                </span>
                <StatusChip status={row.payment?.status} />
              </div>
            ))}
          </AnimatedList>
        </div>
      </Card>
    </div>
  );
}

function StatusChip({ status }: { status?: "PENDING" | "APPROVED" | "REJECTED" | null }) {
  if (status === "APPROVED") {
    return <Chip tone="jade" icon={<CircleCheck className="h-3.5 w-3.5" aria-hidden />}>ยืนยันแล้ว</Chip>;
  }
  if (status === "PENDING") {
    return <Chip tone="gold" icon={<Clock3 className="h-3.5 w-3.5" aria-hidden />}>รอตรวจ</Chip>;
  }
  if (status === "REJECTED") {
    return <Chip tone="flame" icon={<CircleX className="h-3.5 w-3.5" aria-hidden />}>ไม่ผ่าน</Chip>;
  }
  return <Chip>ยังไม่โอน</Chip>;
}
