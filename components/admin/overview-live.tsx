"use client";

import Link from "next/link";
import { useState } from "react";
import { getAdminOverview, listDisputedProofs } from "@/actions/admin";
import { StatusChip } from "@/components/admin/status-chip";
import { CountUp } from "@/components/bits/count-up";
import { GradientText } from "@/components/bits/gradient-text";
import { SpotlightCard } from "@/components/bits/spotlight-card";
import { Card } from "@/components/ui/card";
import { TableShell } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { useLivePoll } from "@/hooks/use-live-poll";
import { CircleAlert, Link2, MousePointerClick, Receipt, Users, UserPlus } from "lucide-react";

type Overview = Awaited<ReturnType<typeof getAdminOverview>>;
type Disputed = Awaited<ReturnType<typeof listDisputedProofs>>;

function formatJoined(value: Date | string) {
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

export function AdminOverviewLive({
  initial,
  initialDisputed,
}: {
  initial: Overview;
  initialDisputed: Disputed;
}) {
  const [data, setData] = useState(initial);
  const [disputed, setDisputed] = useState(initialDisputed);

  useLivePoll(async () => {
    const [next, nextDisputed] = await Promise.all([getAdminOverview(), listDisputedProofs()]);
    setData(next);
    setDisputed(nextDisputed);
  }, 8000);

  const cards = [
    {
      label: "รออนุมัติ",
      hint: "สมาชิกที่ยังไม่เปิดไอดี",
      value: data.pendingUsers,
      href: "/admin/members",
      icon: <UserPlus className="h-4 w-4" />,
      tone: "text-gold",
      accent: "border-l-gold bg-gold/10",
    },
    {
      label: "สมาชิกใช้งาน",
      hint: `จากทั้งหมด ${data.totalMembers} คน`,
      value: data.activeUsers,
      href: "/admin/members",
      icon: <Users className="h-4 w-4" />,
      tone: "text-jade",
      accent: "border-l-jade bg-jade/10",
    },
    {
      label: "ส่งลิงก์วันนี้",
      hint: "จำนวนลิงก์ที่เข้าวันนี้",
      value: data.linksToday,
      href: "/admin/late",
      icon: <Link2 className="h-4 w-4" />,
      tone: "text-flame",
      accent: "border-l-flame bg-flame/10",
    },
    {
      label: "กดคืนวันนี้",
      hint: "หลักฐานที่ส่งเข้ามาแล้ว",
      value: data.proofsToday,
      href: "/admin/late",
      icon: <MousePointerClick className="h-4 w-4" />,
      tone: "text-sky",
      accent: "border-l-sky bg-sky/10",
    },
    {
      label: "สลิปรอตรวจ",
      hint: "ต้องอนุมัติหรือปฏิเสธ",
      value: data.slipsPending,
      href: "/admin/payments",
      icon: <Receipt className="h-4 w-4" />,
      tone: "text-gold",
      accent: "border-l-gold bg-gold/10",
    },
    {
      label: "หลักฐานที่ถูกรายงาน",
      hint: "หลักฐานที่สมาชิกทักท้วง",
      value: data.disputed,
      href: "/admin/late",
      icon: <CircleAlert className="h-4 w-4" />,
      tone: "text-danger",
      accent: "border-l-danger bg-danger/10",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="DASHBOARD"
        title={<GradientText as="span">ภาพรวมกลุ่ม</GradientText>}
        description={`ใช้งาน ${data.activeUsers} · รออนุมัติ ${data.pendingUsers} · พัก ${data.inactiveUsers} · แบน ${data.bannedUsers}`}
        clock
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="block">
            <SpotlightCard className={`border-l-4 ${card.accent}`}>
              <p className={`flex items-center gap-2 text-xs font-medium ${card.tone}`}>
                <span aria-hidden>{card.icon}</span>
                {card.label}
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">
                <CountUp to={card.value} />
              </p>
              <p className="mt-1 text-xs text-mute">{card.hint}</p>
            </SpotlightCard>
          </Link>
        ))}
      </div>
      <Card padded={false}>
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-semibold">สมาชิกล่าสุด</h2>
          <Link href="/admin/members" className="text-sm font-semibold text-flame hover:underline">
            จัดการทั้งหมด
          </Link>
        </div>
        {data.latest.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-mute">ยังไม่มีสมาชิก</p>
        ) : (
          <TableShell caption="สมาชิกล่าสุด">
            <thead>
              <tr>
                <th>ชื่อ</th>
                <th>ยูสเซอร์เนม</th>
                <th>สถานะ</th>
                <th>เข้าร่วม</th>
              </tr>
            </thead>
            <tbody>
              {data.latest.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link href={`/admin/members/${row.id}`} className="font-semibold hover:text-flame">
                      {row.displayName}
                    </Link>
                  </td>
                  <td className="text-sm text-mute">{row.username}</td>
                  <td>
                    <StatusChip status={row.status} />
                  </td>
                  <td className="text-sm whitespace-nowrap text-mute">{formatJoined(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </Card>
      {disputed.length ? (
        <Card padded={false}>
          <h2 className="px-5 py-4 font-semibold">หลักฐานที่ถูกรายงาน</h2>
          <TableShell caption="หลักฐานที่ถูกรายงาน">
            <thead>
              <tr>
                <th>ผู้ส่งหลักฐาน</th>
                <th>เจ้าของลิงก์</th>
                <th>หลักฐาน</th>
              </tr>
            </thead>
            <tbody>
              {disputed.map((item) => (
                <tr key={item.id}>
                  <td className="font-semibold">{item.clicker.displayName}</td>
                  <td className="text-sm text-mute">{item.dailyLink.user.displayName}</td>
                  <td>
                    <a href={item.imageUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-flame hover:underline">
                      เปิดรูป
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </Card>
      ) : null}
    </div>
  );
}
