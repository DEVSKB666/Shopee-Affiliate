"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  countMembers,
  createMember,
  deleteMember,
  listMembers,
  setUserStatus,
} from "@/actions/admin";
import { StatusChip } from "@/components/admin/status-chip";
import { RoleChip } from "@/components/admin/role-chip";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TableShell } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ImageUpload } from "@/components/ui/image-upload";
import { PASSWORD_MIN_LENGTH } from "@/lib/validation";
import { useLivePoll } from "@/hooks/use-live-poll";
import { Ban, Download, Pause, Pencil, Search, Trash2, UserPlus, UserRound } from "lucide-react";

type Row = Awaited<ReturnType<typeof listMembers>>[number];
type Counts = Awaited<ReturnType<typeof countMembers>>;
type StatusFilter = "all" | "pending" | "active" | "inactive" | "banned";

const FILTERS: { id: StatusFilter; label: string; key: keyof Counts }[] = [
  { id: "all", label: "ทั้งหมด", key: "all" },
  { id: "pending", label: "รออนุมัติ", key: "pending" },
  { id: "active", label: "ใช้งาน", key: "active" },
  { id: "inactive", label: "พักไอดี", key: "inactive" },
  { id: "banned", label: "แบน", key: "banned" },
];

function formatJoined(value: Date | string) {
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
    year: "2-digit",
  }).format(new Date(value));
}

export function MembersManager({
  initialRows,
  initialCounts,
  canManage,
}: {
  initialRows: Row[];
  initialCounts: Counts;
  canManage: boolean;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [counts, setCounts] = useState(initialCounts);
  const [removing, setRemoving] = useState<Row | null>(null);
  const [pending, start] = useTransition();

  function load(nextQuery = query, nextStatus = status) {
    return Promise.all([listMembers(nextQuery, nextStatus), countMembers()]).then(([nextRows, nextCounts]) => {
      setRows(nextRows);
      setCounts(nextCounts);
    });
  }

  useLivePoll(() => load(), 8000);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      listMembers(query, status).then(setRows);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [query, status]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title="สมาชิก" description="ค้นหา เพิ่ม อนุมัติ แก้ข้อมูล และลบออกจากกลุ่ม" />
        <a
          href="/api/admin/members.csv"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-paper-2 px-4 text-sm font-semibold transition duration-200 hover:bg-mist"
        >
          <Download className="h-4 w-4" aria-hidden />
          ดาวน์โหลด CSV
        </a>
      </div>

      <Card className={!canManage ? "hidden" : undefined}>
        <h2 className="font-semibold">เพิ่มสมาชิกแทนแอดมิน</h2>
        <form
          className="mt-3"
          action={(formData) => {
            start(async () => {
              const result = await createMember(formData);
              toast(result.message, result.ok ? "ok" : "err");
              if (result.ok) load();
            });
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-mute">ชื่อในกลุ่ม</span>
              <input name="displayName" required placeholder="ชื่อในกลุ่ม" className="field" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-mute">ยูสเซอร์เนม</span>
              <input name="username" required placeholder="username" className="field" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-mute">รหัสผ่าน</span>
              <input name="password" type="password" required minLength={PASSWORD_MIN_LENGTH} placeholder="อย่างน้อย 4 ตัวอักษร" className="field" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-mute">ช่องทางติดต่อ</span>
              <input name="contact" placeholder="Line / Facebook" className="field" />
            </label>
            <div className="sm:col-span-2"><ImageUpload name="avatar" label="รูปโปรไฟล์" disabled={pending} /></div>
          </div>
          <Button
            type="submit"
            spark
            className="mt-4"
            disabled={pending}
            icon={<UserPlus className="h-4 w-4" aria-hidden />}
          >
            เพิ่มสมาชิก
          </Button>
        </form>
      </Card>

      <Card padded={false}>
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={status === item.id}
                onClick={() => {
                  setStatus(item.id);
                  load(query, item.id);
                }}
                className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3 text-xs font-semibold transition duration-200 ${
                  status === item.id
                    ? "border-flame bg-flame text-white"
                    : "border-border bg-canvas text-ink hover:bg-mist"
                }`}
              >
                {item.label}
                <span className={status === item.id ? "text-white/80" : "text-mute"}>{counts[item.key]}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">ค้นหาสมาชิก</span>
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-mute" aria-hidden />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ค้นหาชื่อ ยูสเซอร์เนม หรือช่องทางติดต่อ"
                className="field pl-10"
              />
            </label>
            <Button type="button" tone="ghost" onClick={() => load()} icon={<Search className="h-4 w-4" aria-hidden />}>
              ค้นหา
            </Button>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState
              className="border-dashed bg-canvas"
              icon={<UserRound className="h-6 w-6" />}
              title="ยังไม่มีรายการ"
              body="ลองเปลี่ยนคำค้นหรือสถานะ"
            />
          </div>
        ) : (
          <TableShell caption="ตารางสมาชิก">
            <thead>
              <tr>
                <th>บทบาท</th>
                <th>สมาชิก</th>
                <th>ติดต่อ</th>
                <th>สถานะ</th>
                <th>เตือน</th>
                <th>เข้าร่วม</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td><RoleChip role={row.role} /></td>
                  <td>
                    <Link href={`/admin/members/${row.id}`} className="flex min-w-0 items-center gap-3">
                      {row.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-mist text-xs font-semibold">
                          {row.displayName.slice(0, 1)}
                        </span>
                      )}
                      <span className="min-w-0">
                        <p className="font-semibold">{row.displayName}</p>
                        <p className="truncate text-xs text-mute">
                          {row.username}
                          {row.facebookId ? " · Facebook" : ""}
                        </p>
                      </span>
                    </Link>
                  </td>
                  <td className="text-sm text-mute">{row.contact || "—"}</td>
                  <td>
                    <StatusChip status={row.status} />
                  </td>
                  <td className="text-sm tabular-nums">{row.warnCount}</td>
                  <td className="text-sm whitespace-nowrap text-mute">{formatJoined(row.createdAt)}</td>
                  <td>
                    <div className={canManage ? "flex items-center justify-end gap-1 whitespace-nowrap" : "hidden"}>
                      <Link
                        href={`/admin/members/${row.id}`}
                        aria-label={`แก้ไข ${row.displayName}`}
                        className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-paper-2 text-ink transition duration-200 hover:bg-mist"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </Link>
                      {row.status !== "ACTIVE" ? (
                        <Button
                          type="button"
                          tone="jade"
                          size="sm"
                          onClick={() => setUserStatus(row.id, "ACTIVE").then(() => load())}
                        >
                          อนุมัติ
                        </Button>
                      ) : null}
                      {row.status !== "INACTIVE" ? (
                        <Button
                          type="button"
                          tone="gold"
                          size="icon"
                          aria-label={`พักไอดี ${row.displayName}`}
                          icon={<Pause className="h-4 w-4" aria-hidden />}
                          onClick={() => setUserStatus(row.id, "INACTIVE").then(() => load())}
                        />
                      ) : null}
                      {row.status !== "BANNED" ? (
                        <Button
                          type="button"
                          tone="danger-ghost"
                          size="icon"
                          aria-label={`แบน ${row.displayName}`}
                          icon={<Ban className="h-4 w-4" aria-hidden />}
                          onClick={() => setUserStatus(row.id, "BANNED").then(() => load())}
                        />
                      ) : null}
                      <Button
                        type="button"
                        tone="danger-ghost"
                        size="icon"
                        aria-label={`ลบ ${row.displayName}`}
                        icon={<Trash2 className="h-4 w-4" aria-hidden />}
                        onClick={() => setRemoving(row)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(removing)}
        title={`ลบ ${removing?.displayName ?? "สมาชิก"}?`}
        description="การลบไม่สามารถย้อนกลับได้ ลิงก์ หลักฐานกดคืน สลิป และบัญชีล็อกอินของสมาชิกนี้จะถูกลบด้วย"
        confirmLabel="ลบสมาชิก"
        pending={pending}
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          if (!removing) return;
          start(async () => {
            const result = await deleteMember(removing.id);
            toast(result.message, result.ok ? "ok" : "err");
            if (result.ok) {
              setRemoving(null);
              load();
            }
          });
        }}
      />
    </div>
  );
}
