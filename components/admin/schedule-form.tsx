"use client";

import { useState, useTransition } from "react";
import type { Setting } from "@/generated/prisma/client";
import { saveSchedule } from "@/actions/schedule";
import { padTime, dayPhase, formatBangkokClock } from "@/lib/bangkok";
import { scheduleFields, scheduleSchema } from "@/lib/schedule";
import { useNow } from "@/hooks/use-now";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Save } from "lucide-react";

export function ScheduleForm({ settings }: { settings: Setting }) {
  const [submitTime, setSubmitTime] = useState(padTime(settings.submitHour, settings.submitMinute));
  const [proofTime, setProofTime] = useState(padTime(settings.proofHour, settings.proofMinute));
  const [saved, setSaved] = useState({ submitTime, proofTime });
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const now = useNow();
  const parsed = scheduleSchema.safeParse({ submitTime, proofTime });
  const fields = parsed.success ? scheduleFields(submitTime, proofTime) : null;
  const phase = fields && now ? dayPhase(fields.submitHour, fields.proofHour, now, fields.submitMinute, fields.proofMinute) : null;
  const dirty = saved.submitTime !== submitTime || saved.proofTime !== proofTime;

  return (
    <Card className="mb-5 border-flame/40">
      <form action={(form) => start(async () => {
        setMessage("");
        try {
        const result = await saveSchedule(form);
        setMessage(result.message);
        if (result.ok) setSaved({ submitTime: result.submitTime, proofTime: result.proofTime });
        } catch {
          setMessage("เชื่อมต่อไม่สำเร็จ กรุณาลองบันทึกอีกครั้ง");
        }
      })}>
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Clock className="h-5 w-5 text-flame" aria-hidden />เวลาประจำวัน</h2>
        <p className="mt-2 text-sm text-mute">เวลาประเทศไทย · {now ? formatBangkokClock(now) : "--:--:--"} น. · เริ่มรอบใหม่ทุกวันเวลา 00:00</p>
        <p className="mt-2 text-sm">เวลาที่บันทึกไว้: ปิดรับลิงก์ {saved.submitTime} · ปิดรับหลักฐาน {saved.proofTime}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <TimeSelect label="ปิดรับลิงก์" name="submitTime" value={submitTime} onChange={setSubmitTime} disabled={pending} />
          <TimeSelect label="ปิดรับหลักฐานกดคืน" name="proofTime" value={proofTime} onChange={setProofTime} disabled={pending} />
        </div>
        <div className="mt-4 rounded-2xl bg-mist p-4 text-sm" aria-live="polite">
          {!parsed.success ? <p className="text-flame">{parsed.error.issues[0].message}</p> : <>
            <p>ส่งลิงก์ถึง {submitTime} น. · ส่งหลักฐานถึง {proofTime} น.</p>
            <p className="mt-1 text-mute">{phase?.phase === "closed" ? "เมื่อบันทึก รอบวันนี้จะปิดรับงานทันที" : phase ? `เมื่อบันทึก จะ${phase.phase === "submit" ? "เปิดรับลิงก์ถึง " + submitTime : "เปิดรับหลักฐานต่อถึง " + proofTime} วันนี้` : "เวลาใหม่มีผลทันทีหลังบันทึก"}</p>
            <p className="mt-1 text-mute">งานที่ส่งแล้วจะยังอยู่ การเปลี่ยนเวลาไม่ย้อนกลับใบเตือนที่ออกแล้ว</p>
          </>}
        </div>
        <p role="status" className="mt-3 text-sm">{message}</p>
        <Button className="mt-3 w-full sm:w-auto" type="submit" disabled={pending || !dirty || !parsed.success} icon={<Save className="h-4 w-4" aria-hidden />}>{pending ? "กำลังบันทึก..." : "บันทึกเวลา"}</Button>
      </form>
    </Card>
  );
}

function TimeSelect({ label, name, value, onChange, disabled }: { label: string; name: string; value: string; onChange: (value: string) => void; disabled: boolean }) {
  const [hour, minute] = value.split(":");
  return <fieldset disabled={disabled}>
    <legend className="mb-2 text-sm font-semibold">{label}</legend>
    <input type="hidden" name={name} value={value} />
    <div className="flex items-center gap-2">
      <select aria-label={`${label} ชั่วโมง`} className="field min-w-0 flex-1 text-lg" value={hour} onChange={e => onChange(`${e.target.value}:${minute}`)}>{Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map(v => <option key={v}>{v}</option>)}</select>
      <span aria-hidden>:</span>
      <select aria-label={`${label} นาที`} className="field min-w-0 flex-1 text-lg" value={minute} onChange={e => onChange(`${hour}:${e.target.value}`)}>{Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map(v => <option key={v}>{v}</option>)}</select>
    </div>
  </fieldset>;
}
