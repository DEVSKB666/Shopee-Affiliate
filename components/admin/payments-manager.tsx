"use client";

import { useState, useTransition } from "react";
import { listPayments, reviewPayment } from "@/actions/admin";
import { StatusChip } from "@/components/admin/status-chip";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { TableShell } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { useLivePoll } from "@/hooks/use-live-poll";
import { CircleCheck, CircleX, Receipt, Search } from "lucide-react";

type Row = Awaited<ReturnType<typeof listPayments>>[number];

function paymentChip(status?: string | null) {
  if (status === "APPROVED") return <Chip tone="jade" icon={<CircleCheck className="h-3.5 w-3.5" aria-hidden />}>ยืนยันแล้ว</Chip>;
  if (status === "PENDING") return <Chip tone="gold">รอตรวจ</Chip>;
  if (status === "REJECTED") return <Chip tone="flame">ไม่ผ่าน</Chip>;
  return <Chip>ยังไม่ส่ง</Chip>;
}

export function PaymentsManager({ initialRows, initialMonth, canManage }: { initialRows: Row[]; initialMonth: string; canManage: boolean }) {
  const [monthKey, setMonthKey] = useState(initialMonth);
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [pending, start] = useTransition();

  function load(next = monthKey) {
    listPayments(next).then(setRows);
  }

  useLivePoll(() => listPayments(monthKey).then(setRows), 8000);

  return (
    <div className="space-y-5">
      <PageHeader title="สลิปโอน" description="ตรวจสลิปรายเดือน อนุมัติแล้วจะเปิดไอดีที่รออยู่ให้อัตโนมัติ" />
      <Card padded={false}>
        <div className="flex gap-2 p-5">
          <input
            type="month"
            value={monthKey}
            onChange={(event) => {
              setMonthKey(event.target.value);
              listPayments(event.target.value).then(setRows);
            }}
            className="field max-w-56"
          />
          <Button type="button" tone="ghost" onClick={() => load()} icon={<Search className="h-4 w-4" aria-hidden />}>
            ดูรอบนี้
          </Button>
        </div>
        {rows.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState className="border-dashed bg-canvas" icon={<Receipt className="h-6 w-6" />} title="ยังไม่มีสลิปในรอบนี้" />
          </div>
        ) : (
          <TableShell caption="ตารางสลิปรายเดือน">
            <thead>
              <tr>
                <th>สมาชิก</th>
                <th>สถานะไอดี</th>
                <th>สลิป</th>
                <th>ตรวจ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.userId}>
                  <td className="font-semibold">{row.displayName}</td>
                  <td>
                    <StatusChip status={row.userStatus} />
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {paymentChip(row.payment?.status)}
                      {row.payment?.slipUrl ? (
                        <a href={row.payment.slipUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-flame hover:underline">
                          เปิดสลิป
                        </a>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    {canManage && row.payment && row.payment.status === "PENDING" ? (
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button
                          type="button"
                          tone="jade"
                          size="sm"
                          spark
                          disabled={pending}
                          onClick={() =>
                            start(async () => {
                              await reviewPayment(row.payment!.id, "APPROVED");
                              toast("อนุมัติแล้ว", "ok");
                              load();
                            })
                          }
                        >
                          ผ่าน
                        </Button>
                        <Button
                          type="button"
                          tone="danger-ghost"
                          size="sm"
                          disabled={pending}
                          icon={<CircleX className="h-3.5 w-3.5" aria-hidden />}
                          onClick={() =>
                            start(async () => {
                              await reviewPayment(row.payment!.id, "REJECTED");
                              toast("ปฏิเสธสลิปแล้ว", "warn");
                              load();
                            })
                          }
                        >
                          ไม่ผ่าน
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-mute">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </Card>
    </div>
  );
}
