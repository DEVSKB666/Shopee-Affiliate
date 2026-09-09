"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/session";
import { assertCanRegister, facebookConfigured, newMemberStatus } from "@/lib/settings";

const registerSchema = z.object({
  displayName: z.string().trim().min(2, "ใส่ชื่อในกลุ่มอย่างน้อย 2 ตัวอักษร").max(40),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "ยูสเซอร์เนมอย่างน้อย 3 ตัว")
    .max(24)
    .regex(/^[a-z0-9._]+$/, "ใช้ได้เฉพาะ a-z 0-9 จุด และขีดล่าง"),
  password: z.string().min(6, "รหัสผ่านอย่างน้อย 6 ตัว"),
  contact: z.string().trim().max(80).optional(),
  inviteCode: z.string().trim().optional(),
});

export async function registerUser(formData: FormData) {
  try {
    const settings = await getSettings();
    await assertCanRegister(settings);

    const parsed = registerSchema.safeParse({
      displayName: formData.get("displayName"),
      username: formData.get("username"),
      password: formData.get("password"),
      contact: formData.get("contact") || undefined,
      inviteCode: formData.get("inviteCode") || undefined,
    });

    if (!parsed.success) {
      return { ok: false as const, message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ครบ" };
    }

    if (settings.inviteCodeRequired && parsed.data.inviteCode !== settings.inviteCode) {
      return { ok: false as const, message: "รหัสชวนเพื่อนไม่ถูกต้อง" };
    }

    const exists = await prisma.user.findUnique({
      where: { username: parsed.data.username },
    });
    if (exists) {
      return { ok: false as const, message: "ยูสเซอร์เนมนี้ถูกใช้แล้ว" };
    }

    const nameTaken = await prisma.user.findFirst({
      where: { displayName: parsed.data.displayName },
    });
    if (nameTaken) {
      return { ok: false as const, message: "ชื่อในกลุ่มนี้มีคนใช้แล้ว" };
    }

    const status = newMemberStatus(settings);
    await prisma.user.create({
      data: {
        displayName: parsed.data.displayName,
        username: parsed.data.username,
        passwordHash: await bcrypt.hash(parsed.data.password, 10),
        contact: parsed.data.contact,
        status,
      },
    });

    return {
      ok: true as const,
      message: status === "ACTIVE" ? "สมัครสำเร็จ เข้าสู่ระบบได้เลย" : settings.contactNote,
    };
  } catch (error) {
    return { ok: false as const, message: error instanceof Error ? error.message : "สมัครไม่สำเร็จ" };
  }
}

export async function loginUser(formData: FormData) {
  try {
    await signIn("credentials", {
      username: String(formData.get("username") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: "/app",
    });
    return { ok: true as const };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false as const, message: "ยูสเซอร์เนมหรือรหัสผ่านไม่ถูกต้อง" };
    }
    throw error;
  }
}

export async function loginWithFacebook() {
  const settings = await getSettings();
  if (!settings.facebookLoginEnabled || !facebookConfigured()) {
    return { ok: false as const, message: "ยังไม่เปิดเข้าสู่ระบบด้วย Facebook" };
  }
  await signIn("facebook", { redirectTo: "/app" });
}

export async function logoutUser() {
  await signOut({ redirectTo: "/" });
}
