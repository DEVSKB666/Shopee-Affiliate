"use client";

import Link from "next/link";
import { useState } from "react";
import { loginUser, loginWithFacebook } from "@/actions/auth";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { LogIn, Lock, UserRound } from "lucide-react";

export function LoginForm({ facebookEnabled }: { facebookEnabled?: boolean }) {
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    const result = await loginUser(formData);
    setPending(false);
    if (result && !result.ok) toast(result.message, "err");
  }

  return (
    <div className="space-y-3">
      <form action={onSubmit} className="space-y-3">
        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-mute">
            <UserRound className="h-3.5 w-3.5" aria-hidden />
            ยูสเซอร์เนม
          </span>
          <input name="username" required autoComplete="username" className="field" placeholder="mira" />
        </label>
        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-mute">
            <Lock className="h-3.5 w-3.5" aria-hidden />
            รหัสผ่าน
          </span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="field"
          />
        </label>
        <Button type="submit" spark className="w-full" disabled={pending} icon={<LogIn className="h-4 w-4" aria-hidden />}>
          {pending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </Button>
      </form>
      {facebookEnabled ? (
        <form
          action={async () => {
            const result = await loginWithFacebook();
            if (result && !result.ok) toast(result.message, "err");
          }}
        >
          <button
            type="submit"
            className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-sky text-sm font-semibold text-white"
          >
            เข้าสู่ระบบด้วย Facebook
          </button>
        </form>
      ) : null}
      <p className="text-center text-sm text-mute">
        ยังไม่มีไอดี?{" "}
        <Link href="/" className="font-semibold text-flame">
          สมัครสมาชิก
        </Link>
      </p>
    </div>
  );
}
