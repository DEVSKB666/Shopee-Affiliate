"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/actions/auth";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { KeyRound, Lock, Phone, UserPlus, UserRound } from "lucide-react";

export function RegisterForm({
  inviteRequired,
  contactNote,
}: {
  inviteRequired?: boolean;
  contactNote?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    const result = await registerUser(formData);
    setPending(false);
    if (!result.ok) {
      toast(result.message, "err");
      return;
    }
    toast(result.message);
    router.push("/login");
  }

  return (
    <form action={onSubmit} className="space-y-3">
      <label className="block">
        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-mute">
          <UserRound className="h-3.5 w-3.5" aria-hidden />
          ชื่อ-สกุล / ชื่อเล่นในกลุ่ม
        </span>
        <input name="displayName" required className="field" placeholder="เช่น มิระ ตลาดนัด" />
      </label>
      <label className="block">
        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-mute">
          <UserPlus className="h-3.5 w-3.5" aria-hidden />
          ยูสเซอร์เนม
        </span>
        <input name="username" required className="field" placeholder="mira" />
      </label>
      <label className="block">
        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-mute">
          <Lock className="h-3.5 w-3.5" aria-hidden />
          รหัสผ่าน
        </span>
        <input name="password" type="password" required minLength={6} className="field" />
      </label>
      <label className="block">
        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-mute">
          <Phone className="h-3.5 w-3.5" aria-hidden />
          Line ID / Facebook
        </span>
        <input name="contact" className="field" placeholder="line: mira.click" />
      </label>
      {inviteRequired ? (
        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-mute">
            <KeyRound className="h-3.5 w-3.5" aria-hidden />
            รหัสชวนเพื่อน
          </span>
          <input name="inviteCode" required className="field" />
        </label>
      ) : null}
      <p className="rounded-2xl bg-gold/20 px-4 py-3 text-xs leading-relaxed text-ink">
        {contactNote || "หลังสมัคร ไอดีจะรออนุมัติ"}
      </p>
      <Button type="submit" spark className="w-full" disabled={pending} icon={<UserPlus className="h-4 w-4" aria-hidden />}>
        {pending ? "กำลังสมัคร..." : "ยืนยันการลงทะเบียน"}
      </Button>
    </form>
  );
}
