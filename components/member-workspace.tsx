"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  disputeProof,
  getGroupStats,
  getMemberLiveState,
  getMyPending,
  getPendingOwners,
  getReport,
  searchOwnerLink,
  submitLink,
  submitProof,
} from "@/actions/member";
import { ClockRing } from "@/components/clock-ring";
import { toast } from "@/components/toast";
import { AnimatedList } from "@/components/bits/animated-list";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconTabBar } from "@/components/ui/icon-tab";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useLivePoll } from "@/hooks/use-live-poll";
import { useNow } from "@/hooks/use-now";
import { bangkokDateISO, dayPhase, formatBangkokClock, thaiDateLabel, type DayPhaseState } from "@/lib/bangkok";
import { playSfx } from "@/lib/sfx";
import type { getMemberHomeData } from "@/lib/queries";
import {
  BarChart3,
  ClipboardList,
  ExternalLink,
  Link2,
  Medal,
  MousePointerClick,
  ScrollText,
  Search,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";

type Home = NonNullable<Awaited<ReturnType<typeof getMemberHomeData>>>;
type Tab = "send" | "click" | "report" | "pending" | "stats" | "rules";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "send", label: "ส่งลิงก์", icon: <Link2 className="h-4 w-4" /> },
  { id: "click", label: "กดลิงก์", icon: <MousePointerClick className="h-4 w-4" /> },
  { id: "report", label: "คนกดให้เรา", icon: <Users className="h-4 w-4" /> },
  { id: "pending", label: "งานค้าง", icon: <ClipboardList className="h-4 w-4" /> },
  { id: "stats", label: "สถิติกลุ่ม", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "rules", label: "กติกา", icon: <ScrollText className="h-4 w-4" /> },
];

export function MemberWorkspace({ data: initial }: { data: Home }) {
  const [data, setData] = useState(initial);
  const now = useNow();
  const phase = now
    ? dayPhase(data.settings.submitHour, data.settings.proofHour, now)
    : data.phase;
  const previousPhase = useRef(initial.phase.phase);
  const [tab, setTab] = useState<Tab>("send");

  async function refreshLive() {
    const next = await getMemberLiveState();
    if (next) setData(next);
  }

  useLivePoll(refreshLive, 8000);

  useEffect(() => {
    if (previousPhase.current === phase.phase) return;
    previousPhase.current = phase.phase;
    void refreshLive();
    if (phase.phase === "click") toast("หมดเวลาส่งลิงก์ ไปกดคืนได้เลย", "warn");
    if (phase.phase === "closed") toast("หมดเวลากดคืนวันนี้แล้ว", "warn");
    if (phase.phase === "submit") toast("เปิดรอบส่งลิงก์ของวันนี้แล้ว", "ok");
  }, [phase.phase]);

  const todayLabel = thaiDateLabel(now ? bangkokDateISO(now) : data.today);

  const phaseTone =
    phase.phase === "submit" ? "from-flame/10" : phase.phase === "click" ? "from-gold/20" : "from-mute/10";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6">
      <Card className={`overflow-hidden bg-gradient-to-br ${phaseTone} to-paper-2`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <UserAvatar name={data.user.name ?? "สมาชิก"} src={data.user.avatarUrl} size="lg" />
            <div className="min-w-0">
              <p className="font-mono text-[11px] tracking-[0.2em] text-mute">TODAY TICKET</p>
              <h1 className="mt-1 text-xl font-semibold">{data.user.name}</h1>
              <p className="text-sm text-mute">{todayLabel}</p>
              <p className="mt-1 inline-flex items-center gap-1.5 font-mono text-xs tabular-nums text-jade">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-jade" />
                {now ? formatBangkokClock(now) : "--:--:--"} น.
              </p>
            </div>
          </div>
          <ClockRing compact phase={phase} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <Stat label="ส่งลิงก์" value={data.myLink ? "ส่งแล้ว" : "ยังไม่ส่ง"} />
          <Stat label="กดแล้ว" value={`${data.proofsDone}/${data.linksToday}`} />
          <Stat label="คนกดให้เรา" value={`${data.proofsForMe}`} />
        </div>
      </Card>

      <div className="mt-5">
        <IconTabBar items={TABS} value={tab} onChange={setTab} />
      </div>

      <Card className="mt-4">
        {tab === "send" && <SendPanel data={data} phase={phase} onSaved={refreshLive} />}
        {tab === "click" && <ClickPanel onSaved={refreshLive} />}
        {tab === "report" && <ReportPanel today={data.today} />}
        {tab === "pending" && <PendingPanel today={data.today} onGoClick={() => setTab("click")} />}
        {tab === "stats" && <StatsPanel today={data.today} />}
        {tab === "rules" && (
          <RulesPanel
            submitHour={data.settings.submitHour}
            proofHour={data.settings.proofHour}
            rulesText={data.settings.rulesText}
          />
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-canvas px-2 py-3">
      <p className="text-mute">{label}</p>
      <p className="mt-1 font-semibold text-ink">{value}</p>
    </div>
  );
}

function SendPanel({
  data,
  phase,
  onSaved,
}: {
  data: Home;
  phase: DayPhaseState;
  onSaved: () => void;
}) {
  const [pending, start] = useTransition();
  const closed = phase.phase !== "submit" && !data.myLink;

  return (
    <form
      action={(formData) => {
        start(async () => {
          const result = await submitLink(formData);
          toast(result.message, result.ok ? "ok" : "err");
          if (result.ok) onSaved();
        });
      }}
    >
      <h2 className="text-lg font-semibold">ส่งลิงก์ประจำวัน</h2>
      <p className="mt-1 text-sm text-mute">
        ตัด {String(data.settings.submitHour).padStart(2, "0")}:00 น. ของวันนี้
      </p>
      <label className="mt-5 block">
        <span className="mb-1.5 block text-xs text-mute">หัวข้อสินค้า</span>
        <input
          name="title"
          required
          defaultValue={data.myLink?.title ?? ""}
          className="field"
          placeholder="ทิชชู่ลดราคา"
        />
      </label>
      <label className="mt-3 block">
        <span className="mb-1.5 block text-xs text-mute">ลิงก์ Shopee / Facebook / Reels</span>
        <input
          name="url"
          type="url"
          required
          defaultValue={data.myLink?.url ?? ""}
          className="field"
          placeholder="https://shope.ee/..."
        />
      </label>
      <Button
        type="submit"
        spark
        className="mt-5 w-full"
        disabled={pending || (phase.phase !== "submit" && !data.myLink)}
        icon={<Link2 className="h-4 w-4" aria-hidden />}
      >
        {pending ? "กำลังบันทึก..." : data.myLink ? "อัปเดตลิงก์วันนี้" : "บันทึกลิงก์เข้าระบบ"}
      </Button>
      {closed ? (
        <p className="mt-3 text-center text-xs text-flame">หมดเวลาส่งลิงก์วันนี้แล้ว</p>
      ) : null}
    </form>
  );
}

function ClickPanel({ onSaved }: { onSaved: () => void }) {
  const [owners, setOwners] = useState<Awaited<ReturnType<typeof getPendingOwners>>>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string>("");
  const [target, setTarget] = useState<{
    id: string;
    title: string;
    url: string;
    ownerName: string;
    ownerAvatar: string | null;
  } | null>(null);
  const [pending, start] = useTransition();

  useLivePoll(() => getPendingOwners().then(setOwners).catch(() => setOwners([])), 5000);

  const filtered = useMemo(
    () => owners.filter((item) => item.displayName.toLowerCase().includes(query.toLowerCase())),
    [owners, query],
  );

  function pick(ownerId: string) {
    playSfx("click");
    setSelected(ownerId);
    start(async () => {
      const result = await searchOwnerLink(ownerId);
      if (!result.ok) {
        toast(result.message, result.already ? "ok" : "warn");
        setTarget(null);
        return;
      }
      setTarget(result.data);
    });
  }

  return (
    <div>
      <h2 className="text-lg font-semibold">ดึงลิงก์แล้วส่งงาน</h2>
      <p className="mt-1 text-sm text-mute">เหลืออีก {owners.length} คนที่ยังไม่ได้กด</p>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="ค้นหาชื่อเพื่อน"
        className="field mt-4"
      />
      <div className="mt-3 max-h-48 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="rounded-2xl bg-jade/10 px-4 py-6 text-center text-sm text-jade">
            กดครบแล้วสำหรับวันนี้
          </p>
        ) : (
          <AnimatedList>
            {filtered.map((item) => (
            <button
              type="button"
              key={item.ownerId}
              onClick={() => pick(item.ownerId)}
              className={`flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left transition duration-200 ${
                selected === item.ownerId ? "bg-flame text-white" : "bg-canvas hover:bg-mist"
              }`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <UserAvatar name={item.displayName} src={item.avatarUrl} size="sm" />
                <span className="min-w-0">
                  <span className="block font-medium">{item.displayName}</span>
                  <span className="block truncate text-xs opacity-70">{item.title}</span>
                </span>
              </span>
            </button>
            ))}
          </AnimatedList>
        )}
      </div>

      {target ? (
        <form
          className="mt-5 rounded-[24px] border border-dashed border-gold bg-gold/15 p-4"
          action={(formData) => {
            start(async () => {
              const result = await submitProof(formData);
              toast(result.message, result.ok ? "ok" : "err");
              if (result.ok) {
                setTarget(null);
                setSelected("");
                setOwners(await getPendingOwners());
                onSaved();
              }
            });
          }}
        >
          <input type="hidden" name="ownerId" value={selected} />
          <div className="flex items-center gap-3">
            <UserAvatar name={target.ownerName} src={target.ownerAvatar} />
            <div>
              <p className="text-sm font-semibold">{target.ownerName}</p>
              <p className="text-sm text-mute">{target.title}</p>
            </div>
          </div>
          <a
            href={target.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-flame text-sm font-semibold text-white"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            เปิดลิงก์แล้วไปกด
          </a>
          <label className="mt-4 block text-sm">
            รูปหลักฐาน
            <input
              name="proof"
              type="file"
              accept="image/*"
              required
              className="mt-2 block w-full text-xs"
            />
          </label>
          <Button type="submit" tone="jade" className="mt-4 w-full" disabled={pending}>
            {pending ? "กำลังอัปโหลด..." : "ยืนยันการส่งงาน"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}

function ReportPanel({ today }: { today: string }) {
  const [date, setDate] = useState(today);
  const [pending, start] = useTransition();
  const [report, setReport] = useState<Awaited<ReturnType<typeof getReport>> | null>(null);

  function load(next = date) {
    start(async () => setReport(await getReport(next)));
  }

  useLivePoll(() => getReport(date).then(setReport), 8000);

  return (
    <div>
      <h2 className="text-lg font-semibold">คนกดลิงก์ให้เรา</h2>
      <div className="mt-4 flex gap-2">
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="field flex-1"
        />
        <Button type="button" tone="ghost" onClick={() => load()} className="min-w-24">
          {pending ? "..." : "ดูรายงาน"}
        </Button>
      </div>
      {report && !report.hasLink ? (
        <p className="mt-6 text-center text-sm text-mute">วันนั้นคุณยังไม่ได้ส่งลิงก์</p>
      ) : null}
      {report?.hasLink ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-jade">กดให้แล้ว {report.clicked.length}</h3>
            {report.clicked.map((item) => (
              <div key={item.id} className="mb-2 flex items-center justify-between gap-3 rounded-2xl bg-canvas px-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <UserAvatar name={item.name} src={item.avatarUrl} size="sm" />
                  <div className="min-w-0">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-mute">
                      {new Date(item.at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                      {item.disputed ? " · แจ้งสลิปแล้ว" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={item.imageUrl} target="_blank" rel="noreferrer" className="text-xs text-jade">
                    ดูรูป
                  </a>
                  {!item.disputed ? (
                    <button
                      type="button"
                      className="text-xs text-flame"
                      onClick={() => {
                        playSfx("click");
                        disputeProof(item.id).then((result) => {
                          toast(result.message, result.ok ? "ok" : "err");
                          if (result.ok) load();
                        });
                      }}
                    >
                      ไม่ใช่สลิปฉัน
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-flame">ยังไม่กด {report.pending.length}</h3>
            {report.pending.map((item) => (
              <div key={item.name} className="mb-2 flex items-center gap-3 rounded-2xl bg-flame/10 px-3 py-3 font-medium text-flame">
                <UserAvatar name={item.name} src={item.avatarUrl} size="sm" />
                {item.name}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PendingPanel({ today, onGoClick }: { today: string; onGoClick: () => void }) {
  const [date, setDate] = useState(today);
  const [rows, setRows] = useState<Awaited<ReturnType<typeof getMyPending>>>([]);

  function load(next = date) {
    getMyPending(next).then(setRows);
  }

  useLivePoll(() => getMyPending(date).then(setRows), 8000);

  const leftover = rows.filter((row) => row.hasLink && !row.done).length;

  return (
    <div>
      <h2 className="text-lg font-semibold">งานค้างของเรา</h2>
      <div className="mt-4 flex gap-2">
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="field flex-1"
        />
        <Button type="button" tone="ghost" onClick={() => load()} icon={<Search className="h-4 w-4" aria-hidden />}>
          เช็ก
        </Button>
      </div>
      <p className={`mt-4 rounded-2xl px-4 py-3 text-center text-sm ${leftover ? "bg-flame/10 text-flame" : "bg-jade/10 text-jade"}`}>
        {leftover ? `ค้างอีก ${leftover} คน` : "ส่งงานครบแล้ว"}
      </p>
      <div className="mt-4 space-y-2">
        {rows.map((row) => (
          <div key={row.ownerId} className="flex items-center justify-between gap-3 rounded-2xl bg-canvas px-3 py-3">
            <span className={`flex min-w-0 items-center gap-3 ${row.done ? "text-jade" : row.hasLink ? "text-flame" : "text-mute"}`}>
              <UserAvatar name={row.displayName} src={row.avatarUrl} size="sm" />
              <span className="truncate">{row.displayName}</span>
            </span>
            {row.done ? (
              <a href={row.imageUrl ?? "#"} target="_blank" rel="noreferrer" className="text-xs text-jade">
                ภาพ
              </a>
            ) : row.hasLink ? (
              <button
                type="button"
                onClick={() => {
                  playSfx("click");
                  onGoClick();
                }}
                className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-flame px-3 text-xs text-white"
              >
                ไปกด
              </button>
            ) : (
              <span className="text-xs text-mute">ยังไม่ส่งลิงก์</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsPanel({ today }: { today: string }) {
  const [mode, setMode] = useState<"monthly" | "daily">("monthly");
  const [date, setDate] = useState(today);
  const [rows, setRows] = useState<Awaited<ReturnType<typeof getGroupStats>>["rows"]>([]);

  function load(nextMode = mode, nextDate = date) {
    getGroupStats(nextMode, nextDate).then((result) => setRows(result.rows));
  }

  useLivePoll(() => getGroupStats(mode, date).then((result) => setRows(result.rows)), 10000);

  return (
    <div>
      <h2 className="text-lg font-semibold">กระดานผู้นำ</h2>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            playSfx("click");
            setMode("monthly");
            load("monthly");
          }}
          className={`min-h-11 rounded-full text-sm ${mode === "monthly" ? "bg-gold text-teak" : "bg-canvas"}`}
        >
          สะสมเดือนนี้
        </button>
        <button
          type="button"
          onClick={() => {
            playSfx("click");
            setMode("daily");
            load("daily");
          }}
          className={`min-h-11 rounded-full text-sm ${mode === "daily" ? "bg-gold text-teak" : "bg-canvas"}`}
        >
          เจาะจงรายวัน
        </button>
      </div>
      {mode === "daily" ? (
        <input
          type="date"
          value={date}
          onChange={(event) => {
            setDate(event.target.value);
            load("daily", event.target.value);
          }}
          className="field mt-3"
        />
      ) : null}
      <div className="mt-5 space-y-3">
        {rows.map((row, index) => {
          const width = row.percent ?? 0;
          return (
            <div key={row.id}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-2">
                  {index === 0 ? (
                    <Trophy className="h-4 w-4 text-gold" aria-label="อันดับ 1" />
                  ) : index === 1 ? (
                    <Medal className="h-4 w-4 text-mute" aria-label="อันดับ 2" />
                  ) : index === 2 ? (
                    <Medal className="h-4 w-4 text-flame" aria-label="อันดับ 3" />
                  ) : (
                    <span className="font-mono text-xs text-mute">#{index + 1}</span>
                  )}
                  <UserAvatar name={row.displayName} src={row.avatarUrl} size="sm" />
                  {row.displayName}
                </span>
                <span className="font-mono">{row.percent === null ? "-" : `${row.percent}%`}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-mist">
                <div
                  className={`h-full ${width === 100 ? "bg-jade" : width >= 50 ? "bg-gold" : "bg-flame"}`}
                  style={{ width: `${width}%` }}
                />
              </div>
              <p className="mt-1 text-right text-[11px] text-mute">
                {row.actual} / {row.target} ลิงก์
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RulesPanel({
  submitHour,
  proofHour,
  rulesText,
}: {
  submitHour: number;
  proofHour: number;
  rulesText: string;
}) {
  return (
    <div className="space-y-4 text-sm leading-7">
      <h2 className="text-lg font-semibold">กติกากลุ่ม</h2>
      <div className="rounded-2xl bg-gold/20 p-4">
        <p className="font-semibold">เวลากะของวัน</p>
        <p>ส่งลิงก์ภายใน {String(submitHour).padStart(2, "0")}:00 น.</p>
        <p>กดคืนและอัปโหลดหลักฐานภายใน {String(proofHour).padStart(2, "0")}:00 น.</p>
      </div>
      <div className="whitespace-pre-wrap rounded-2xl bg-canvas p-4">{rulesText}</div>
      <Link
        href="/app/pay"
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-jade font-semibold text-white"
      >
        <Wallet className="h-4 w-4" aria-hidden />
        แจ้งโอนรายเดือน
      </Link>
    </div>
  );
}
