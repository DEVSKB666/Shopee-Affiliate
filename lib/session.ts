import { prisma } from "@/lib/prisma";

export type AppRole = "ADMIN" | "MODERATOR" | "MEMBER";

export function isStaffRole(role: AppRole | string | null | undefined): role is "ADMIN" | "MODERATOR" {
  return role === "ADMIN" || role === "MODERATOR";
}

export async function getSettings() {
  return prisma.setting.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
}

export async function requireSessionUser() {
  const { auth } = await import("@/auth");
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("กรุณาเข้าสู่ระบบ");
  }
  const current = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, status: true, username: true, displayName: true },
  });
  if (!current || current.status === "BANNED") throw new Error("บัญชีนี้ถูกระงับ");
  return { ...session.user, ...current, name: current.displayName };
}

export async function requireActiveMember() {
  const user = await requireSessionUser();
  if (user.role !== "MEMBER" || user.status !== "ACTIVE") {
    throw new Error("ไอดีนี้ยังใช้ระบบคลิกไม่ได้");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireSessionUser();
  if (user.role !== "ADMIN" || user.status !== "ACTIVE") {
    throw new Error("สำหรับแอดมินเท่านั้น");
  }
  return user;
}

export async function requireStaff() {
  const user = await requireSessionUser();
  if (!isStaffRole(user.role) || user.status !== "ACTIVE") {
    throw new Error("สำหรับเจ้าหน้าที่เท่านั้น");
  }
  return user;
}
