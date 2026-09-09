"use client";

import { useTransition } from "react";
import { saveSettings } from "@/actions/admin";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import type { Setting } from "@/generated/prisma/client";
import { Save } from "lucide-react";

export function SettingsForm({ settings }: { settings: Setting }) {
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-5"
      action={(formData) => {
        start(async () => {
          const result = await saveSettings(formData);
          toast(result.message, result.ok ? "ok" : "err");
        });
      }}
    >
      <PageHeader title="ตั้งค่าเว็บ" description="ชื่อเว็บ รูป โหมดสมัคร ล็อกอิน และกติกากลุ่ม" />

      <Section title="แบรนด์และข้อความ">
        <Field label="ชื่อเว็บ" name="siteName" defaultValue={settings.siteName} />
        <Field label="คำโปรย" name="tagline" defaultValue={settings.tagline} />
        <Field label="หัวข้อหน้าแรก" name="heroTitle" defaultValue={settings.heroTitle} />
        <Field label="คำอธิบายหน้าแรก" name="heroSubtitle" defaultValue={settings.heroSubtitle} textarea />
        <Field label="Title SEO" name="metaTitle" defaultValue={settings.metaTitle} />
        <Field label="Description SEO" name="metaDescription" defaultValue={settings.metaDescription} textarea />
        <Field label="ข้อความหลังสมัคร" name="contactNote" defaultValue={settings.contactNote} textarea />
        <Field label="ประกาศแถบบน" name="announcement" defaultValue={settings.announcement} />
        <Field label="ลิงก์ Facebook แอดมิน" name="adminFacebook" defaultValue={settings.adminFacebook} />
        <FileField label="โลโก้" name="logo" current={settings.logoUrl} />
        <FileField label="Favicon" name="favicon" current={settings.faviconUrl} />
        <FileField label="รูปหน้าแรก" name="heroImage" current={settings.heroImageUrl} />
      </Section>

      <Section title="การสมัครและโหมดฟรี">
        <Toggle name="registrationOpen" defaultChecked={settings.registrationOpen} label="เปิดรับสมัคร" />
        <Toggle name="requirePayment" defaultChecked={settings.requirePayment} label="ต้องโอนก่อนถึงจะใช้ระบบ" />
        <Toggle
          name="autoActivateOnRegister"
          defaultChecked={settings.autoActivateOnRegister}
          label="ถ้าไม่ต้องโอน เปิดไอดีทันทีหลังสมัคร"
        />
        <Field label="จำนวนสมาชิกสูงสุด (0 = ไม่จำกัด)" name="maxMembers" type="number" defaultValue={settings.maxMembers} />
        <Toggle name="inviteCodeRequired" defaultChecked={settings.inviteCodeRequired} label="ต้องใส่รหัสชวนเพื่อน" />
        <Field label="รหัสชวนเพื่อน" name="inviteCode" defaultValue={settings.inviteCode} />
      </Section>

      <Section title="ล็อกอินโซเชียล">
        <Toggle name="facebookLoginEnabled" defaultChecked={settings.facebookLoginEnabled} label="เปิดปุ่ม Facebook" />
        <p className="sm:col-span-2 text-xs text-mute">
          ปุ่มจะขึ้นจริงเมื่อใส่ AUTH_FACEBOOK_ID และ AUTH_FACEBOOK_SECRET ในเซิร์ฟเวอร์ด้วย
        </p>
        <Toggle name="lineLoginEnabled" defaultChecked={settings.lineLoginEnabled} label="เตรียม LINE Login (ยังไม่เชื่อม)" />
        <Toggle name="googleLoginEnabled" defaultChecked={settings.googleLoginEnabled} label="เตรียม Google Login (ยังไม่เชื่อม)" />
      </Section>

      <Section title="กติกาและโดเมนลิงก์">
        <Field label="กติกาที่โชว์สมาชิก" name="rulesText" defaultValue={settings.rulesText} textarea className="sm:col-span-2" />
        <Field
          label="โดเมนที่อนุญาต (คั่นด้วยจุลภาค)"
          name="allowedDomains"
          defaultValue={settings.allowedDomains}
          className="sm:col-span-2"
        />
        <Field label="ลิงก์ต่อวัน" name="linksPerDay" type="number" defaultValue={settings.linksPerDay} />
        <Field label="ชั่วโมงตัดส่งลิงก์" name="submitHour" type="number" defaultValue={settings.submitHour} />
        <Field label="ชั่วโมงตัดกดคืน" name="proofHour" type="number" defaultValue={settings.proofHour} />
        <Field label="วันที่แล้วเตือน" name="missDaysWarn" type="number" defaultValue={settings.missDaysWarn} />
        <Field label="วันที่แล้วพักไอดี" name="missDaysSuspend" type="number" defaultValue={settings.missDaysSuspend} />
      </Section>

      <Section title="บัญชีโอน">
        <Field label="ค่าสมาชิกต่อเดือน" name="fee" type="number" defaultValue={settings.fee} />
        <Field label="ธนาคาร" name="bankName" defaultValue={settings.bankName} />
        <Field label="เลขบัญชี" name="bankAccount" defaultValue={settings.bankAccount} />
        <Field label="ชื่อบัญชี" name="accountName" defaultValue={settings.accountName} />
        <FileField label="QR โอนเงิน" name="qrImage" current={settings.qrImageUrl} />
      </Section>

      <Section title="แจ้งเตือน">
        <Toggle name="notifyEnabled" defaultChecked={settings.notifyEnabled} label="เปิด webhook แจ้งเตือน (ยังไม่ยิงจริง)" />
        <Field label="Webhook URL" name="notifyWebhook" defaultValue={settings.notifyWebhook} className="sm:col-span-2" />
      </Section>

      <Button type="submit" spark className="w-full" disabled={pending} icon={<Save className="h-4 w-4" aria-hidden />}>
        {pending ? "กำลังบันทึก..." : "บันทึกตั้งค่า"}
      </Button>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">{children}</div>
    </Card>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  textarea = false,
  className = "",
}: {
  label: string;
  name: string;
  defaultValue: string | number;
  type?: string;
  textarea?: boolean;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs text-mute">{label}</span>
      {textarea ? (
        <textarea name={name} rows={3} defaultValue={defaultValue} className="field" />
      ) : (
        <input name={name} type={type} defaultValue={defaultValue} className="field" />
      )}
    </label>
  );
}

function FileField({ label, name, current }: { label: string; name: string; current: string }) {
  return (
    <label className="block sm:col-span-2">
      <span className="mb-1 block text-xs text-mute">{label}</span>
      {current ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={current} alt="" className="mb-2 h-16 rounded-xl object-contain" />
      ) : null}
      <input name={name} type="file" accept="image/*" />
    </label>
  );
}

function Toggle({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex min-h-11 items-center gap-3 rounded-2xl bg-mist px-3 py-3 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-flame" />
      {label}
    </label>
  );
}
