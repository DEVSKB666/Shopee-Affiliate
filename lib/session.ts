import { prisma } from "@/lib/prisma";

export async function getSettings() {
  const existing = await prisma.setting.findUnique({ where: { id: "default" } });
  if (existing) return existing;
  return prisma.setting.create({ data: { id: "default" } });
}

export async function requireSessionUser() {
  const { auth } = await import("@/auth");
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("กรุณาเข้าสู่ระบบ");
  }
  return session.user;
}

export async function requireActiveMember() {
  const user = await requireSessionUser();
  if (user.role !== "ADMIN" && user.status !== "ACTIVE") {
    throw new Error("ไอดีนี้ยังใช้ระบบคลิกไม่ได้");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireSessionUser();
  if (user.role !== "ADMIN") {
    throw new Error("สำหรับแอดมินเท่านั้น");
  }
  return user;
}
