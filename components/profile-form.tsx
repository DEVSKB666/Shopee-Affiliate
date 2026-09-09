"use client";

import { useTransition } from "react";
import { updateMyProfile } from "@/actions/member";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Save } from "lucide-react";

export function ProfileForm({
  profile,
}: {
  profile: {
    displayName: string;
    contact: string | null;
    avatarUrl: string | null;
    facebookId: string | null;
  };
}) {
  const [pending, start] = useTransition();

  return (
    <form
      className="mt-6 space-y-3"
      action={(formData) => {
        start(async () => {
          const result = await updateMyProfile(formData);
          toast(result.message, result.ok ? "ok" : "err");
        });
      }}
    >
      <UserAvatar name={profile.displayName} src={profile.avatarUrl} size="lg" />
      <label className="block">
        <span className="mb-1 block text-xs text-mute">ชื่อในกลุ่ม</span>
        <input name="displayName" defaultValue={profile.displayName} className="field" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-mute">ช่องทางติดต่อ</span>
        <input name="contact" defaultValue={profile.contact ?? ""} className="field" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-mute">รูปโปรไฟล์</span>
        <input name="avatar" type="file" accept="image/*" />
      </label>
      {profile.facebookId ? (
        <Chip tone="jade">ผูก Facebook แล้ว</Chip>
      ) : null}
      <Button
        type="submit"
        spark
        className="w-full"
        disabled={pending}
        icon={<Save className="h-4 w-4" aria-hidden />}
      >
        {pending ? "กำลังบันทึก..." : "บันทึกโปรไฟล์"}
      </Button>
    </form>
  );
}
