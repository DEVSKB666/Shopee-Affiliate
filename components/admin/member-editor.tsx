"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteMember, updateMember } from "@/actions/admin";
import { StatusChip } from "@/components/admin/status-chip";
import { RoleChip } from "@/components/admin/role-chip";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MemberLinkEditor } from "@/components/admin/member-link-editor";
import { TableShell } from "@/components/ui/data-table";
import { ImageUpload } from "@/components/ui/image-upload";
import { PASSWORD_MIN_LENGTH } from "@/lib/validation";
import { Save, Trash2 } from "lucide-react";

type Member = {
  id: string;
  displayName: string;
  username: string;
  contact: string;
  adminNote: string;
  status: "PENDING" | "ACTIVE" | "INACTIVE" | "BANNED";
  role: "MEMBER" | "MODERATOR" | "ADMIN";
  warnCount: number;
  avatarUrl: string | null;
  facebookId: string | null;
  createdAt: string;
  providers: string[];
  payments: { id: string; monthKey: string; status: string }[];
  links: { id: string; title: string; url: string; workDate: string }[];
};

export function MemberEditor({ member, canManage = true }: { member: Member; canManage?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex items-center gap-4">
          {member.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={member.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-full bg-mist text-lg font-semibold">
              {member.displayName.slice(0, 1)}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold">{member.displayName}</h1>
            <p className="text-sm text-mute">
              {member.username}
              {member.facebookId || member.providers.includes("facebook") ? " · Facebook" : ""}
            </p>
            <div className="mt-2">
              <StatusChip status={member.status} />
              <span className="ml-2"><RoleChip role={member.role} /></span>
            </div>
          </div>
        </div>

        <form
          className="mt-6 grid gap-3 sm:grid-cols-2"
          action={(formData) => {
            start(async () => {
              const result = await updateMember(member.id, formData);
              toast(result.message, result.ok ? "ok" : "err");
            });
          }}
        >
          <label className="block">
            <span className="mb-1 block text-xs text-mute">ชื่อในกลุ่ม</span>
            <input name="displayName" defaultValue={member.displayName} required disabled={!canManage || pending} className="field" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-mute">ยูสเซอร์เนม</span>
            <input name="username" defaultValue={member.username} required disabled={!canManage || pending} className="field" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-mute">ช่องทางติดต่อ</span>
            <input name="contact" defaultValue={member.contact} disabled={!canManage || pending} className="field" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-mute">สถานะ</span>
            <select name="status" defaultValue={member.status} disabled={!canManage || pending} className="field">
              <option value="PENDING">รออนุมัติ</option>
              <option value="ACTIVE">ใช้งาน</option>
              <option value="INACTIVE">พักไอดี</option>
              <option value="BANNED">แบน</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-mute">ใบเตือน</span>
            <input name="warnCount" type="number" min={0} defaultValue={member.warnCount} disabled={!canManage || pending} className="field" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-mute">รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)</span>
            <input name="password" type="password" minLength={PASSWORD_MIN_LENGTH} disabled={!canManage || pending} className="field" placeholder="อย่างน้อย 4 ตัวอักษร" />
          </label>
          <label className="sm:col-span-2 block">
            <span className="mb-1 block text-xs text-mute">โน้ตแอดมิน</span>
            <textarea name="adminNote" rows={3} defaultValue={member.adminNote} disabled={!canManage || pending} className="field" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-mute">บทบาท</span>
            <select name="role" defaultValue={member.role} disabled={!canManage || pending} className="field">
              <option value="MEMBER">สมาชิก</option>
              <option value="MODERATOR">ผู้ตรวจสอบ</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
          <div className="sm:col-span-2"><ImageUpload name="avatar" label="รูปโปรไฟล์" current={member.avatarUrl} disabled={!canManage || pending} /></div>
          <Button
            type="submit"
            spark
            className="sm:col-span-2 w-full"
            disabled={pending || !canManage}
            icon={<Save className="h-4 w-4" aria-hidden />}
          >
            {pending ? "กำลังบันทึก..." : "บันทึกสมาชิก"}
          </Button>
        </form>
      </Card>

      <Card padded={false}>
        <h2 className="px-5 py-4 font-semibold">สลิปล่าสุด</h2>
        {member.payments.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-mute">ยังไม่มีสลิป</p>
        ) : (
          <TableShell caption="สลิปล่าสุดของสมาชิก">
            <thead>
              <tr>
                <th>รอบเดือน</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {member.payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.monthKey}</td>
                  <td>
                    <Chip tone={payment.status === "APPROVED" ? "jade" : payment.status === "PENDING" ? "gold" : "flame"}>
                      {payment.status === "APPROVED" ? "ยืนยันแล้ว" : payment.status === "PENDING" ? "รอตรวจ" : "ไม่ผ่าน"}
                    </Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </Card>

      <Card padded={false}>
        <h2 className="px-5 py-4 font-semibold">ลิงก์ล่าสุด</h2>
        {member.links.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-mute">ยังไม่ส่งลิงก์</p>
        ) : (
          <div className="space-y-3 px-5 pb-5">
            <p className="text-xs text-mute">แอดมินแก้หัวข้อและ URL ได้แม้พ้นเวลาส่งลิงก์แล้ว หลักฐานที่ส่งไว้ยังคงอยู่</p>
            {member.links.map((link) => (
              <MemberLinkEditor key={link.id} userId={member.id} link={link} readOnly={!canManage} />
            ))}
          </div>
        )}
      </Card>

      <Card className={!canManage ? "hidden" : undefined}>
        <h2 className="font-semibold text-flame">ลบสมาชิก</h2>
        <p className="mt-1 text-sm text-mute">ลบแล้วไม่สามารถกู้คืนได้ รวมถึงลิงก์ หลักฐาน และสลิปของคนนี้</p>
        <Button
          type="button"
          tone="danger-ghost"
          className="mt-4"
          icon={<Trash2 className="h-4 w-4" aria-hidden />}
          onClick={() => setConfirmDelete(true)}
        >
          ลบสมาชิก
        </Button>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        title={`ลบ ${member.displayName}?`}
        description="การลบไม่สามารถย้อนกลับได้ ลิงก์ หลักฐานกดคืน สลิป และบัญชีล็อกอินของสมาชิกนี้จะถูกลบด้วย"
        confirmLabel="ลบสมาชิก"
        pending={pending}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          start(async () => {
            const result = await deleteMember(member.id);
            toast(result.message, result.ok ? "ok" : "err");
            if (result.ok) router.push("/admin/members");
          });
        }}
      />
    </div>
  );
}
