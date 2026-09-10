"use client";

import { logoutUser } from "@/actions/auth";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <form action={logoutUser}>
      <button
        type="submit"
        className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 text-xs text-mute transition duration-200 hover:bg-mist"
      >
        <LogOut className="h-3.5 w-3.5" aria-hidden />
        ออกจากระบบ
      </button>
    </form>
  );
}
