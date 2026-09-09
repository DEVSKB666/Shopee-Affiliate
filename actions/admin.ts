"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { bangkokDateISO, dateFromISO, dayPhase } from "@/lib/bangkok";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { checkbox } from "@/lib/settings";
import { saveImage } from "@/lib/upload";

export async function getAdminOverview() {
  await requireAdmin();
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
  };
}

export async function listMembers(query = "", status: "all" | "pending" | "active" | "inactive" | "banned" = "all") {
  await requireAdmin();
  return prisma.user.findMany({
    where: {
      role: "MEMBER",
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
      createdAt: true,
    },
  });
}

export async function getMemberDetail(userId: string) {
  await requireAdmin();
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      accounts: true,
      payments: { orderBy: { createdAt: "desc" }, take: 6 },
      links: { orderBy: { workDate: "desc" }, take: 7 },
    },
  });
}

export async function createMember(formData: FormData) {
  await requireAdmin();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const contact = String(formData.get("contact") ?? "").trim();
  if (displayName.length < 2 || username.length < 3 || password.length < 6) {
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
  await requireAdmin();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const contact = String(formData.get("contact") ?? "").trim();
  const adminNote = String(formData.get("adminNote") ?? "").trim();
  const status = String(formData.get("status") ?? "ACTIVE") as
    | "PENDING"
    | "ACTIVE"
    | "INACTIVE"
    | "BANNED";
  const warnCount = Number(formData.get("warnCount") ?? 0);
  const password = String(formData.get("password") ?? "");

  const file = formData.get("avatar") as File | null;
  const avatarUrl = file && file.size > 0 ? await saveImage(file, "avatars") : undefined;

  await prisma.user.update({
    where: { id: userId },
    data: {
      displayName,
      username,
      contact: contact || null,
      adminNote: adminNote || null,
      status,
      warnCount: Number.isFinite(warnCount) ? warnCount : 0,
      ...(avatarUrl ? { avatarUrl } : {}),
      ...(password.length >= 6 ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
    },
  });
  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${userId}`);
  return { ok: true as const, message: "บันทึกสมาชิกแล้ว" };
}

export async function setUserStatus(userId: string, status: "ACTIVE" | "INACTIVE" | "BANNED" | "PENDING") {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { status } });
  revalidatePath("/admin");
  revalidatePath("/admin/members");
  return { ok: true as const };
}

export async function countMembers() {
  await requireAdmin();
  const [all, pending, active, inactive, banned] = await Promise.all([
    prisma.user.count({ where: { role: "MEMBER" } }),
    prisma.user.count({ where: { role: "MEMBER", status: "PENDING" } }),
    prisma.user.count({ where: { role: "MEMBER", status: "ACTIVE" } }),
    prisma.user.count({ where: { role: "MEMBER", status: "INACTIVE" } }),
    prisma.user.count({ where: { role: "MEMBER", status: "BANNED" } }),
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
  await requireAdmin();
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
  await requireAdmin();
  const workDate = dateFromISO(dateISO ?? bangkokDateISO());
  const settings = await prisma.setting.findUnique({ where: { id: "default" } });

  const [members, links, proofs] = await Promise.all([
    prisma.user.findMany({
      where: { role: "MEMBER", status: "ACTIVE" },
      select: { id: true, displayName: true, warnCount: true },
      orderBy: { displayName: "asc" },
    }),
    prisma.dailyLink.findMany({ where: { workDate }, select: { userId: true } }),
    prisma.clickProof.findMany({
      where: { workDate },
      select: { clickerId: true },
    }),
  ]);

  const submitted = new Set(links.map((link) => link.userId));
  const clickedCount = new Map<string, number>();
  for (const proof of proofs) {
    clickedCount.set(proof.clickerId, (clickedCount.get(proof.clickerId) ?? 0) + 1);
  }

  const target = Math.max(0, submitted.size - 1);
  const missSuspend = settings?.missDaysSuspend ?? 2;

  return members.map((member) => {
    const actual = clickedCount.get(member.id) ?? 0;
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
  const phase = dayPhase(settings?.submitHour ?? 12, settings?.proofHour ?? 22);
  if (phase.phase !== "closed") {
    return { ok: false as const, message: "ออกใบเตือนได้หลังหมดเวลากดคืนแล้ว" };
  }
  const board = await getLateBoard();
  let warned = 0;
  let suspended = 0;
  for (const row of board) {
    if (row.remaining <= 0) continue;
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
  await requireAdmin();
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
  submitHour: z.coerce.number().int().min(0).max(23),
  proofHour: z.coerce.number().int().min(0).max(23),
  fee: z.coerce.number().int().min(0).max(9999),
  bankName: z.string().trim().min(2).max(40),
  bankAccount: z.string().trim().min(4).max(30),
  accountName: z.string().trim().min(2).max(60),
});

export async function saveSettings(formData: FormData) {
  await requireAdmin();
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
    submitHour: formData.get("submitHour"),
    proofHour: formData.get("proofHour"),
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
  await requireAdmin();
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
