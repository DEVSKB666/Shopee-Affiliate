"use client";

import { useRef, useState, useTransition } from "react";
import { ExternalLink, Pencil, Save } from "lucide-react";
import { updateMemberLink } from "@/actions/admin";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";

export function MemberLinkEditor({
  userId,
  link,
  readOnly = false,
}: {
  userId: string;
  link: { id: string; title: string; url: string; workDate: string };
  readOnly?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const submitting = useRef(false);

  return (
    <div className="rounded-2xl border border-border bg-canvas p-4">
      <p className="mb-2 text-xs text-mute">วันที่ {link.workDate}</p>
      {editing && !readOnly ? (
        <form
          className="space-y-3"
          aria-busy={pending}
          onSubmit={(event) => {
            event.preventDefault();
            if (submitting.current) return;
            const formData = new FormData(event.currentTarget);
            submitting.current = true;
            start(async () => {
              try {
                const result = await updateMemberLink(userId, link.id, formData);
                toast(result.message, result.ok ? "ok" : "err");
                if (result.ok) setEditing(false);
              } catch {
                toast("บันทึกลิงก์ไม่สำเร็จ กรุณาลองอีกครั้ง", "err");
              } finally {
                submitting.current = false;
              }
            });
          }}
        >
          <label className="block">
            <span className="mb-1 block text-xs text-mute">หัวข้อสินค้า</span>
            <input name="title" defaultValue={link.title} required minLength={2} maxLength={80} disabled={pending} className="field" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-mute">URL ของลิงก์</span>
            <input name="url" type="url" defaultValue={link.url} required disabled={pending} className="field" />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending} icon={<Save className="h-4 w-4" aria-hidden />}>
              {pending ? "กำลังบันทึก..." : "บันทึกลิงก์"}
            </Button>
            <Button type="button" tone="ghost" disabled={pending} onClick={() => setEditing(false)}>ยกเลิก</Button>
          </div>
        </form>
      ) : (
        <>
          <p className="break-words font-semibold">{link.title}</p>
          <a href={link.url} target="_blank" rel="noreferrer" className="mt-1 block break-all text-sm text-sky hover:underline">{link.url}</a>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {!readOnly ? (
              <Button type="button" tone="ghost" size="sm" onClick={() => setEditing(true)} icon={<Pencil className="h-4 w-4" aria-hidden />}>แก้ไขลิงก์</Button>
            ) : null}
            <a href={link.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 text-xs text-mute hover:text-sky"><ExternalLink className="h-4 w-4" aria-hidden />เปิดลิงก์</a>
          </div>
        </>
      )}
    </div>
  );
}
