"use client";

import { useRef, useState, useTransition } from "react";
import { RefreshCw, Save } from "lucide-react";
import { updateMyProof } from "@/actions/member";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { ImagePreview } from "@/components/ui/image-preview";
import { ImageUpload } from "@/components/ui/image-upload";

export function MyProofEditor({ proofId, imageUrl, ownerName, canEdit, onSaved }: {
  proofId: string;
  imageUrl: string;
  ownerName: string;
  canEdit: boolean;
  onSaved: (imageUrl: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pending, start] = useTransition();
  const submitting = useRef(false);

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="flex items-center gap-3">
        <ImagePreview src={imageUrl} alt={`หลักฐานที่คุณส่งให้ ${ownerName}`} className="h-20 w-20" />
        <div className="min-w-0">
          <p className="text-xs text-jade">หลักฐานที่คุณส่ง</p>
          {canEdit && !editing ? (
            <Button type="button" tone="ghost" size="sm" className="mt-2" icon={<RefreshCw className="h-4 w-4" aria-hidden />} onClick={() => setEditing(true)}>เปลี่ยนรูปหลักฐาน</Button>
          ) : !canEdit ? (
            <p className="mt-2 text-xs text-mute">แก้ไขได้เฉพาะหลักฐานวันนี้ ก่อนหมดเวลาส่งงาน</p>
          ) : null}
        </div>
      </div>
      {editing && (
        <form
          aria-busy={pending}
          onSubmit={(event) => {
            event.preventDefault();
            if (!file || !canEdit || submitting.current) return;
            const formData = new FormData();
            formData.set("proofId", proofId);
            formData.set("proof", file);
            submitting.current = true;
            start(async () => {
              try {
                const result = await updateMyProof(formData);
                toast(result.message, result.ok ? "ok" : "err");
                if (!result.ok) return;
                onSaved(result.imageUrl);
                setEditing(false);
                setFile(null);
              } catch {
                toast("เปลี่ยนรูปไม่สำเร็จ กรุณาลองอีกครั้ง รูปที่เลือกยังอยู่", "err");
              } finally {
                submitting.current = false;
              }
            });
          }}
        >
          <ImageUpload disabled={pending} onChange={setFile} />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="submit" tone="jade" disabled={pending || !file || !canEdit} icon={<Save className="h-4 w-4" aria-hidden />}>{pending ? "กำลังบันทึก..." : "บันทึกรูปใหม่"}</Button>
            <Button type="button" tone="ghost" disabled={pending} onClick={() => { setEditing(false); setFile(null); }}>ยกเลิก</Button>
          </div>
        </form>
      )}
    </div>
  );
}
