import type { Setting } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export function newMemberStatus(settings: Setting) {
  if (settings.requirePayment) return "PENDING" as const;
  if (settings.autoActivateOnRegister) return "ACTIVE" as const;
  return "PENDING" as const;
}

export function parseDomains(value: string) {
  return value
    .split(/[,\s]+/)
    .map((item) => item.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, ""))
    .filter(Boolean);
}

export function isAllowedLink(url: string, allowedDomains: string) {
  const domains = parseDomains(allowedDomains);
  if (domains.length === 0) return true;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

export async function assertCanRegister(settings: Setting) {
  if (!settings.registrationOpen) {
    throw new Error("ตอนนี้ปิดรับสมัครชั่วคราว");
  }
  if (settings.maxMembers > 0) {
    const count = await prisma.user.count({
      where: { role: "MEMBER", status: { not: "BANNED" } },
    });
    if (count >= settings.maxMembers) {
      throw new Error("กลุ่มเต็มแล้ว รอแอดมินเปิดรับเพิ่ม");
    }
  }
}

export function facebookConfigured() {
  return Boolean(process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET);
}

export function checkbox(formData: FormData, name: string) {
  const value = formData.get(name);
  return value === "on" || value === "true" || value === "1";
}
