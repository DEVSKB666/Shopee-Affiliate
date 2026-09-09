"use client";

import { useState, useTransition } from "react";
import { applyMissPenalties, clearDispute, getLateBoard, listDisputedProofs } from "@/actions/admin";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { TableShell } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { useLivePoll } from "@/hooks/use-live-poll";
import { ClipboardList, Search } from "lucide-react";

type LateRow = Awaited<ReturnType<typeof getLateBoard>>[number];
type DisputeRow = Awaited<ReturnType<typeof listDisputedProofs>>[number];

export function LateBoard({
  initialRows,
  initialDisputed,
  initialDate,
}: {
  initialRows: LateRow[];
  initialDisputed: DisputeRow[];
  initialDate: string;
}) {
  const [date, setDate] = useState(initialDate);
  const [rows, setRows] = useState<LateRow[]>(initialRows);
  const [disputed, setDisputed] = useState<DisputeRow[]>(initialDisputed);
  const [pending, start] = useTransition();

  function load(next = date) {
    getLateBoard(next).then(setRows);
    listDisputedProofs().then(setDisputed);
  }

  useLivePoll(() => {
    getLateBoard(date).then(setRows);
    listDisputedProofs().then(setDisputed);
  }, 8000);

  const leftover = rows.filter((row) => row.remaining > 0).length;
  const noLink = rows.filter((row) => !row.submittedLink).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="งานค้าง"
        description="ดูว่าใครยังไม่ส่งลิงก์ หรือกดคืนไม่ครบ แล้วออกใบเตือนได้จากปุ่มด้านล่าง"
      />

      <Card padded={false}>
        <div className="space-y-4 p-5">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                getLateBoard(event.target.value).then(setRows);
              }}
              className="field sm:max-w-56"
            />
            <Button type="button" tone="ghost" onClick={() => load()} icon={<Search className="h-4 w-4" aria-hidden />}>
              เช็กวันนี้
            </Button>
            <Button
              type="button"
              tone="gold"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const result = await applyMissPenalties();
                  toast(result.message, result.ok ? "warn" : "err");
                  if (result.ok) load();
                })
              }
            >
              ออกใบเตือนคนที่ค้างวันนี้
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <p className="rounded-2xl bg-gold/10 px-4 py-3 text-sm">ยังไม่ส่งลิงก์ {noLink} คน</p>
            <p className="rounded-2xl bg-flame/10 px-4 py-3 text-sm">กดคืนไม่ครบ {leftover} คน</p>
          </div>
        </div>
        {rows.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState className="border-dashed bg-canvas" icon={<ClipboardList className="h-6 w-6" />} title="ยังไม่มีข้อมูลวันนี้" />
          </div>
        ) : (
          <TableShell caption="ตารางงานค้างวันนี้">
            <thead>
              <tr>
                <th>สมาชิก</th>
                <th>ลิงก์</th>
                <th>กดคืน</th>
                <th>ใบเตือน</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} data-risk={row.atRisk ? "true" : undefined}>
                  <td className="font-semibold">{row.displayName}</td>
                  <td className="text-sm">{row.submittedLink ? "ส่งแล้ว" : "ยังไม่ส่ง"}</td>
                  <td className="text-sm tabular-nums">
                    {row.actual}/{row.target}
                  </td>
                  <td className="text-sm tabular-nums">{row.warnCount}</td>
                  <td>
                    {row.remaining > 0 ? (
                      <Chip tone="flame">ค้าง {row.remaining}</Chip>
                    ) : (
                      <Chip tone="jade">ครบ</Chip>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </Card>

      <Card padded={false}>
        <h2 className="px-5 py-4 font-semibold">หลักฐานที่ถูกโหวตว่าไม่ใช่สลิป</h2>
        {disputed.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-mute">ยังไม่มีรายการ</p>
        ) : (
          <TableShell caption="หลักฐานที่ถูกโหวต">
            <thead>
              <tr>
                <th>ผู้โหวต</th>
                <th>เจ้าของลิงก์</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {disputed.map((item) => (
                <tr key={item.id}>
                  <td className="font-semibold">{item.clicker.displayName}</td>
                  <td className="text-sm text-mute">{item.dailyLink.user.displayName}</td>
                  <td>
                    <div className="flex flex-wrap justify-end gap-2">
                      <a href={item.imageUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center text-sm font-semibold text-flame hover:underline">
                        เปิดรูป
                      </a>
                      <Button
                        type="button"
                        tone="ghost"
                        size="sm"
                        onClick={() =>
                          clearDispute(item.id).then(() => {
                            toast("เคลียร์แล้ว", "ok");
                            load();
                          })
                        }
                      >
                        เคลียร์
                      </Button>
                    </div>
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
