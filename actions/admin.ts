"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { bangkokDateISO, dateFromISO, dayPhase } from "@/lib/bangkok";
import { prisma } from "@/lib/prisma";
import { getSettings, requireAdmin, requireStaff } from "@/lib/session";
import { checkbox, isAllowedLink } from "@/lib/settings";
import { saveImage } from "@/lib/upload";
import { passwordSchema, assertImageFormSize } from "@/lib/validation";

export async function getAdminOverview() {
  const staff = await requireStaff();
  const today = dateFromISO(bangkokDateISO());
  const [
    pendingUsers,
    activeUsers,
    inactiveUsers,
    bannedUsers,
    totalMembers,
    linksToday,
    proofsToday,
    slipsPending,
    disputed,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "MEMBER", status: "PENDING" } }),
    prisma.user.count({ where: { role: "MEMBER", status: "ACTIVE" } }),
    prisma.user.count({ where: { role: "MEMBER", status: "INACTIVE" } }),
    prisma.user.count({ where: { role: "MEMBER", status: "BANNED" } }),
    prisma.user.count({ where: { role: "MEMBER" } }),
    prisma.dailyLink.count({ where: { workDate: today } }),
    prisma.clickProof.count({ where: { workDate: today } }),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.clickProof.count({ where: { disputed: true } }),
  ]);

  const latest = await prisma.user.findMany({
    where: { role: "MEMBER" },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { id: true, displayName: true, username: true, status: true, createdAt: true },
  });

  return {
    pendingUsers,
    activeUsers,
    inactiveUsers,
    bannedUsers,
    totalMembers,
    linksToday,
    proofsToday,
    slipsPending,
    disputed,
    latest,
    canManage: staff.role === "ADMIN",
  };
}

export async function listMembers(query = "", status: "all" | "pending" | "active" | "inactive" | "banned" = "all") {
  await requireStaff();
  return prisma.user.findMany({
    where: {
      role: { in: ["MEMBER", "MODERATOR"] },
      ...(status === "all" ? {} : { status: status.toUpperCase() as "PENDING" | "ACTIVE" | "INACTIVE" | "BANNED" }),
      ...(query
        ? {
            OR: [
              { displayName: { contains: query, mode: "insensitive" } },
              { username: { contains: query, mode: "insensitive" } },
              { contact: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      displayName: true,
      contact: true,
      avatarUrl: true,
      status: true,
      warnCount: true,
      facebookId: true,
      role: true,
      createdAt: true,
    },
  });
}

export async function getMemberDetail(userId: string) {
  await requireStaff();
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      accounts: true,
      payments: { orderBy: { createdAt: "desc" }, take: 6 },
      links: { orderBy: { workDate: "desc" }, take: 7 },
    },
  });
}

const memberLinkSchema = z.object({
  userId: z.string().trim().min(1).max(100),
  linkId: z.string().trim().min(1).max(100),
  title: z.string().trim().min(2, "ใส่หัวข้ออย่างน้อย 2 ตัวอักษร").max(80, "หัวข้อยาวได้ไม่เกิน 80 ตัวอักษร"),
  url: z.string().trim().url("ลิงก์ไม่ถูกต้อง")
    .refine((value) => value.startsWith("https://") || value.startsWith("http://"), "ต้องเป็นลิงก์ http หรือ https"),
});

export async function updateMemberLink(userId: string, linkId: string, formData: FormData) {
  const sessionAdmin = await requireAdmin();
  const admin = await prisma.user.findUnique({
    where: { id: sessionAdmin.id },
    select: { role: true, status: true },
  });
  if (admin?.role !== "ADMIN" || admin.status !== "ACTIVE") {
    return { ok: false as const, message: "บัญชีนี้ไม่มีสิทธิ์แก้ไขลิงก์" };
  }

  const parsed = memberLinkSchema.safeParse({
    userId,
    linkId,
    title: formData.get("title"),
    url: formData.get("url"),
  });
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }
  const settings = await getSettings();
  if (!isAllowedLink(parsed.data.url, settings.allowedDomains)) {
    return { ok: false as const, message: `ลิงก์ต้องเป็นโดเมนที่อนุญาต: ${settings.allowedDomains}` };
  }

  try {
    const result = await prisma.dailyLink.updateMany({
      where: { id: parsed.data.linkId, userId: parsed.data.userId, user: { role: "MEMBER" } },
      data: { title: parsed.data.title, url: parsed.data.url },
    });
    if (result.count === 0) {
      return { ok: false as const, message: "ไม่พบลิงก์ของสมาชิกนี้ กรุณารีเฟรชหน้า" };
    }
  } catch {
    return { ok: false as const, message: "บันทึกลิงก์ไม่สำเร็จ กรุณาลองอีกครั้ง" };
  }
  revalidatePath(`/admin/members/${parsed.data.userId}`);
  revalidatePath("/app");
  return { ok: true as const, message: "แก้ไขลิงก์สมาชิกแล้ว" };
}

export async function createMember(formData: FormData) {
  await requireAdmin();
  try { assertImageFormSize(formData); } catch (error) {
    return { ok: false as const, message: (error as Error).message };
  }
  const displayName = String(formData.get("displayName") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const contact = String(formData.get("contact") ?? "").trim();
  const passwordResult = passwordSchema.safeParse(password);
  if (!passwordResult.success) return { ok: false as const, message: passwordResult.error.issues[0].message };
  if (displayName.length < 2 || username.length < 3) {
    return { ok: false as const, message: "กรอกชื่อ ยูสเซอร์เนม และรหัสผ่านให้ครบ" };
  }
  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return { ok: false as const, message: "ยูสเซอร์เนมนี้ถูกใช้แล้ว" };

  const file = formData.get("avatar") as File | null;
  const avatarUrl = file && file.size > 0 ? await saveImage(file, "avatars") : null;

  await prisma.user.create({
    data: {
      displayName,
      username,
      passwordHash: await bcrypt.hash(password, 10),
      contact: contact || null,
      avatarUrl,
      status: "ACTIVE",
      role: "MEMBER",
    },
  });
  revalidatePath("/admin/members");
  return { ok: true as const, message: "เพิ่มสมาชิกแล้ว" };
}

export async function updateMember(userId: string, formData: FormData) {
  const admin = await requireAdmin();
  try { assertImageFormSize(formData); } catch (error) {
    return { ok: false as const, message: (error as Error).message };
  }
  const displayName = String(formData.get("displayName") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const contact = String(formData.get("contact") ?? "").trim();
  const adminNote = String(formData.get("adminNote") ?? "").trim();
  const status = String(formData.get("status") ?? "ACTIVE") as
    | "PENDING"
    | "ACTIVE"
    | "INACTIVE"
    | "BANNED";
  const role = String(formData.get("role") ?? "MEMBER") as "MEMBER" | "MODERATOR" | "ADMIN";
  const warnCount = Number(formData.get("warnCount") ?? 0);
  const password = String(formData.get("password") ?? "");

  if (!["MEMBER", "MODERATOR", "ADMIN"].includes(role)) {
    return { ok: false as const, message: "บทบาทไม่ถูกต้อง" };
  }
  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  if (!existing) return { ok: false as const, message: "ไม่พบสมาชิก" };
  if (userId === admin.id && role !== "ADMIN") {
    return { ok: false as const, message: "ไม่สามารถลดบทบาทบัญชีตัวเองได้" };
  }
  if (existing.role === "ADMIN" && role !== "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) return { ok: false as const, message: "ต้องมี Admin อย่างน้อย 1 บัญชี" };
  }

  if (password && !passwordSchema.safeParse(password).success) {
    return { ok: false as const, message: "รหัสผ่านอย่างน้อย 4 ตัวอักษร" };
  }
  const file = formData.get("avatar") as File | null;
  const avatarUrl = file && file.size > 0 ? await saveImage(file, "avatars") : undefined;

  await prisma.user.update({
    where: { id: userId },
    data: {
      displayName,
      username,
      contact: contact || null,
      adminNote: adminNote || null,
      status: role === "ADMIN" || role === "MODERATOR" ? "ACTIVE" : status,
      role,
      warnCount: Number.isFinite(warnCount) ? warnCount : 0,
      ...(avatarUrl ? { avatarUrl } : {}),
      ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
    },
  });
  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${userId}`);
  return { ok: true as const, message: "บันทึกสมาชิกแล้ว" };
}

export async function setUserStatus(userId: string, status: "ACTIVE" | "INACTIVE" | "BANNED" | "PENDING") {
  await requireAdmin();
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target || target.role === "ADMIN") return { ok: false as const, message: "ไม่สามารถแก้สถานะ Admin จากหน้านี้ได้" };
  await prisma.user.update({ where: { id: userId }, data: { status } });
  revalidatePath("/admin");
  revalidatePath("/admin/members");
  return { ok: true as const };
}

export async function countMembers() {
  await requireStaff();
  const [all, pending, active, inactive, banned] = await Promise.all([
    prisma.user.count({ where: { role: { in: ["MEMBER", "MODERATOR"] } } }),
    prisma.user.count({ where: { role: { in: ["MEMBER", "MODERATOR"] }, status: "PENDING" } }),
    prisma.user.count({ where: { role: { in: ["MEMBER", "MODERATOR"] }, status: "ACTIVE" } }),
    prisma.user.count({ where: { role: { in: ["MEMBER", "MODERATOR"] }, status: "INACTIVE" } }),
    prisma.user.count({ where: { role: { in: ["MEMBER", "MODERATOR"] }, status: "BANNED" } }),
  ]);
  return { all, pending, active, inactive, banned };
}

export async function deleteMember(userId: string) {
  const admin = await requireAdmin();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, displayName: true },
  });
  if (!user) return { ok: false as const, message: "ไม่พบสมาชิก" };
  if (user.role !== "MEMBER") return { ok: false as const, message: "ลบได้เฉพาะสมาชิก" };
  if (user.id === admin.id) return { ok: false as const, message: "ลบไอดีตัวเองไม่ได้" };

  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch {
    return { ok: false as const, message: "ลบสมาชิกไม่สำเร็จ" };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${userId}`);
  return { ok: true as const, message: `ลบ ${user.displayName} แล้ว` };
}

export async function listPayments(monthKey: string) {
  await requireStaff();
  const members = await prisma.user.findMany({
    where: { role: "MEMBER" },
    orderBy: { displayName: "asc" },
    select: {
      id: true,
      displayName: true,
      status: true,
      payments: { where: { monthKey }, take: 1 },
    },
  });

  return members.map((member) => ({
    userId: member.id,
    displayName: member.displayName,
    userStatus: member.status,
    payment: member.payments[0] ?? null,
  }));
}

export async function reviewPayment(paymentId: string, status: "APPROVED" | "REJECTED") {
  await requireAdmin();
  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: { status, reviewedAt: new Date() },
    include: { user: true },
  });

  if (status === "APPROVED" && payment.user.status === "PENDING") {
    await prisma.user.update({
      where: { id: payment.userId },
      data: { status: "ACTIVE" },
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  revalidatePath("/app/pay");
  return { ok: true as const };
}

export async function getLateBoard(dateISO?: string) {
  await requireStaff();
  const workDate = dateFromISO(dateISO ?? bangkokDateISO());
  const settings = await prisma.setting.findUnique({ where: { id: "default" } });

  const [members, links, proofs] = await Promise.all([
    prisma.user.findMany({
      where: { role: "MEMBER", status: "ACTIVE" },
      select: { id: true, displayName: true, warnCount: true },
      orderBy: { displayName: "asc" },
    }),
    prisma.dailyLink.findMany({ where: { workDate, user: { role: "MEMBER", status: "ACTIVE" } }, select: { userId: true } }),
    prisma.clickProof.findMany({
      where: { workDate, clicker: { role: "MEMBER", status: "ACTIVE" }, dailyLink: { user: { role: "MEMBER", status: "ACTIVE" } } },
      select: { clickerId: true, dailyLink: { select: { userId: true } } },
    }),
  ]);

  const submitted = new Set(links.map((link) => link.userId));
  const clickedCount = new Map<string, number>();
  for (const proof of proofs) {
    if (proof.clickerId === proof.dailyLink.userId) continue;
    clickedCount.set(proof.clickerId, (clickedCount.get(proof.clickerId) ?? 0) + 1);
  }

  const missSuspend = settings?.missDaysSuspend ?? 2;

  return members.map((member) => {
    const actual = clickedCount.get(member.id) ?? 0;
    const target = Math.max(0, submitted.size - (submitted.has(member.id) ? 1 : 0));
    const remaining = Math.max(0, target - actual);
    return {
      id: member.id,
      displayName: member.displayName,
      submittedLink: submitted.has(member.id),
      actual,
      target,
      remaining,
      warnCount: member.warnCount,
      atRisk: member.warnCount >= missSuspend - 1 && remaining > 0,
    };
  });
}

export async function applyMissPenalties() {
  await requireAdmin();
  const settings = await prisma.setting.findUnique({ where: { id: "default" } });
  const phase = dayPhase(settings?.submitHour ?? 12, settings?.proofHour ?? 22, new Date(), settings?.submitMinute ?? 0, settings?.proofMinute ?? 0);
  if (phase.phase !== "closed") {
    return { ok: false as const, message: "ออกใบเตือนได้หลังหมดเวลากดคืนแล้ว" };
  }
  const board = await getLateBoard();
  let warned = 0;
  let suspended = 0;
  for (const row of board) {
    if (row.remaining <= 0) continue;
    try {
      await prisma.penalty.create({ data: { userId: row.id, workDate: dateFromISO(bangkokDateISO()) } });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") continue;
      throw error;
    }
    const next = row.warnCount + 1;
    const status = next >= (settings?.missDaysSuspend ?? 2) ? "INACTIVE" : "ACTIVE";
    await prisma.user.update({
      where: { id: row.id },
      data: { warnCount: next, ...(status === "INACTIVE" ? { status } : {}) },
    });
    if (status === "INACTIVE") suspended += 1;
    else warned += 1;
  }
  revalidatePath("/admin/late");
  return { ok: true as const, message: `เตือน ${warned} คน พักไอดี ${suspended} คน` };
}

export async function listDisputedProofs() {
  await requireStaff();
  return prisma.clickProof.findMany({
    where: { disputed: true },
    include: {
      clicker: { select: { displayName: true } },
      dailyLink: { include: { user: { select: { displayName: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
}

export async function clearDispute(proofId: string) {
  await requireAdmin();
  await prisma.clickProof.update({ where: { id: proofId }, data: { disputed: false } });
  revalidatePath("/admin");
  revalidatePath("/admin/late");
  return { ok: true as const };
}

const settingsSchema = z.object({
  siteName: z.string().trim().min(2).max(40),
  tagline: z.string().trim().max(80),
  heroTitle: z.string().trim().min(2).max(80),
  heroSubtitle: z.string().trim().max(240),
  metaTitle: z.string().trim().max(80),
  metaDescription: z.string().trim().max(200),
  contactNote: z.string().trim().max(240),
  announcement: z.string().trim().max(200),
  adminFacebook: z.string().trim().max(200),
  allowedDomains: z.string().trim().max(300),
  rulesText: z.string().trim().max(500),
  inviteCode: z.string().trim().max(40),
  notifyWebhook: z.string().trim().max(300),
  maxMembers: z.coerce.number().int().min(0).max(10000),
  linksPerDay: z.coerce.number().int().min(1).max(5),
  missDaysWarn: z.coerce.number().int().min(1).max(14),
  missDaysSuspend: z.coerce.number().int().min(1).max(14),
  fee: z.coerce.number().int().min(0).max(9999),
  bankName: z.string().trim().min(2).max(40),
  bankAccount: z.string().trim().min(4).max(30),
  accountName: z.string().trim().min(2).max(60),
});

export async function saveSettings(formData: FormData) {
  await requireAdmin();
  try { assertImageFormSize(formData); } catch (error) {
    return { ok: false as const, message: (error as Error).message };
  }
  const parsed = settingsSchema.safeParse({
    siteName: formData.get("siteName"),
    tagline: formData.get("tagline"),
    heroTitle: formData.get("heroTitle"),
    heroSubtitle: formData.get("heroSubtitle"),
    metaTitle: formData.get("metaTitle"),
    metaDescription: formData.get("metaDescription"),
    contactNote: formData.get("contactNote"),
    announcement: formData.get("announcement") ?? "",
    adminFacebook: formData.get("adminFacebook") ?? "",
    allowedDomains: formData.get("allowedDomains"),
    rulesText: formData.get("rulesText"),
    inviteCode: formData.get("inviteCode") ?? "",
    notifyWebhook: formData.get("notifyWebhook") ?? "",
    maxMembers: formData.get("maxMembers"),
    linksPerDay: formData.get("linksPerDay"),
    missDaysWarn: formData.get("missDaysWarn"),
    missDaysSuspend: formData.get("missDaysSuspend"),
    fee: formData.get("fee"),
    bankName: formData.get("bankName"),
    bankAccount: formData.get("bankAccount"),
    accountName: formData.get("accountName"),
  });

  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const flags = {
    registrationOpen: checkbox(formData, "registrationOpen"),
    requirePayment: checkbox(formData, "requirePayment"),
    autoActivateOnRegister: checkbox(formData, "autoActivateOnRegister"),
    facebookLoginEnabled: checkbox(formData, "facebookLoginEnabled"),
    lineLoginEnabled: checkbox(formData, "lineLoginEnabled"),
    googleLoginEnabled: checkbox(formData, "googleLoginEnabled"),
    inviteCodeRequired: checkbox(formData, "inviteCodeRequired"),
    notifyEnabled: checkbox(formData, "notifyEnabled"),
  };

  const uploads: Record<string, string> = {};
  for (const key of ["logo", "favicon", "heroImage", "qrImage"] as const) {
    const file = formData.get(key) as File | null;
    if (file && file.size > 0) {
      const url = await saveImage(file, "brand");
      const map = {
        logo: "logoUrl",
        favicon: "faviconUrl",
        heroImage: "heroImageUrl",
        qrImage: "qrImageUrl",
      } as const;
      uploads[map[key]] = url;
    }
  }

  await prisma.setting.upsert({
    where: { id: "default" },
    update: { ...parsed.data, ...flags, ...uploads },
    create: { id: "default", ...parsed.data, ...flags, ...uploads },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath("/app");
  revalidatePath("/");
  return { ok: true as const, message: "บันทึกตั้งค่าแล้ว" };
}

export async function exportMembersCsv() {
  await requireStaff();
  const rows = await prisma.user.findMany({
    where: { role: "MEMBER" },
    orderBy: { displayName: "asc" },
    select: {
      displayName: true,
      username: true,
      contact: true,
      status: true,
      warnCount: true,
    },
  });
  const header = "displayName,username,contact,status,warnCount";
  const body = rows
    .map((row) =>
      [row.displayName, row.username, row.contact ?? "", row.status, row.warnCount]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");
  return `${header}\n${body}`;
}
