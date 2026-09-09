"use server";

import { z } from "zod";
import {
  bangkokDateISO,
  bangkokMonthKey,
  bangkokParts,
  dateFromISO,
  dayPhase,
} from "@/lib/bangkok";
import { prisma } from "@/lib/prisma";
import { getPaymentBoard, getMemberHomeData } from "@/lib/queries";
import { getSettings, requireActiveMember, requireSessionUser } from "@/lib/session";
import { saveImage } from "@/lib/upload";

function asWorkDate(iso?: string) {
  return dateFromISO(iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : bangkokDateISO());
}

function assertCanSubmitLink(submitHour: number) {
  const { hour, minute, second } = bangkokParts();
  if (hour * 3600 + minute * 60 + second >= submitHour * 3600) {
    throw new Error(`หมดเวลาส่งลิงก์วันนี้แล้ว เปิดใหม่หลังเที่ยงคืน (ตัด ${String(submitHour).padStart(2, "0")}:00)`);
  }
}

function assertCanSubmitProof(proofHour: number) {
  const { hour, minute, second } = bangkokParts();
  if (hour * 3600 + minute * 60 + second >= proofHour * 3600) {
    throw new Error(`หมดเวลากดคืนวันนี้แล้ว (ตัด ${String(proofHour).padStart(2, "0")}:00)`);
  }
}

const linkSchema = z.object({
  title: z.string().trim().min(2, "ใส่หัวข้อสินค้าสั้นๆ").max(80),
  url: z
    .string()
    .trim()
    .url("ลิงก์ไม่ถูกต้อง")
    .refine((value) => value.startsWith("https://") || value.startsWith("http://"), "ต้องเป็นลิงก์เว็บ"),
});

export async function submitLink(formData: FormData) {
  try {
    const user = await requireActiveMember();
    const settings = await getSettings();
    assertCanSubmitLink(settings.submitHour);

    const parsed = linkSchema.safeParse({
      title: formData.get("title"),
      url: formData.get("url"),
    });
    if (!parsed.success) {
      return { ok: false as const, message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ครบ" };
    }

    const { isAllowedLink } = await import("@/lib/settings");
    if (!isAllowedLink(parsed.data.url, settings.allowedDomains)) {
      return {
        ok: false as const,
        message: `ลิงก์ต้องเป็นโดเมนที่อนุญาต: ${settings.allowedDomains}`,
      };
    }

    const workDate = asWorkDate();
    const row = await prisma.dailyLink.upsert({
      where: { userId_workDate: { userId: user.id, workDate } },
      update: { title: parsed.data.title, url: parsed.data.url },
      create: {
        userId: user.id,
        workDate,
        title: parsed.data.title,
        url: parsed.data.url,
      },
    });

    return { ok: true as const, message: "บันทึกลิงก์ของวันนี้แล้ว", link: row };
  } catch (error) {
    return { ok: false as const, message: error instanceof Error ? error.message : "บันทึกไม่สำเร็จ" };
  }
}

export async function getPendingOwners() {
  const user = await requireActiveMember();
  const workDate = asWorkDate();

  const links = await prisma.dailyLink.findMany({
    where: { workDate, userId: { not: user.id } },
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true } },
      proofs: { where: { clickerId: user.id }, select: { id: true } },
    },
    orderBy: { user: { displayName: "asc" } },
  });

  return links
    .filter((link) => link.proofs.length === 0)
    .map((link) => ({
      ownerId: link.user.id,
      displayName: link.user.displayName,
      avatarUrl: link.user.avatarUrl,
      linkId: link.id,
      title: link.title,
    }));
}

export async function searchOwnerLink(ownerId: string) {
  const user = await requireActiveMember();
  const workDate = asWorkDate();

  if (ownerId === user.id) {
    return { ok: false as const, message: "ไม่ต้องกดลิงก์ของตัวเอง" };
  }

  const link = await prisma.dailyLink.findUnique({
    where: { userId_workDate: { userId: ownerId, workDate } },
    include: {
      user: { select: { displayName: true, avatarUrl: true } },
      proofs: { where: { clickerId: user.id }, take: 1 },
    },
  });

  if (!link) {
    return { ok: false as const, message: "เพื่อนคนนี้ยังไม่ส่งลิงก์วันนี้" };
  }

  if (link.proofs.length > 0) {
    return { ok: false as const, already: true as const, message: "คุณกดให้คนนี้ไปแล้ว" };
  }

  return {
    ok: true as const,
    data: {
      id: link.id,
      title: link.title,
      url: link.url,
      ownerName: link.user.displayName,
      ownerAvatar: link.user.avatarUrl,
    },
  };
}

export async function submitProof(formData: FormData) {
  try {
    const user = await requireActiveMember();
    const settings = await getSettings();
    assertCanSubmitProof(settings.proofHour);

    const ownerId = String(formData.get("ownerId") ?? "");
    const file = formData.get("proof") as File | null;
    if (!ownerId) return { ok: false as const, message: "กรุณาเลือกเพื่อนที่กดให้" };
    if (!file) return { ok: false as const, message: "กรุณาแนบรูปหลักฐาน" };

    const workDate = asWorkDate();
    const link = await prisma.dailyLink.findUnique({
      where: { userId_workDate: { userId: ownerId, workDate } },
    });
    if (!link) return { ok: false as const, message: "ยังไม่มีลิงก์ของเพื่อนคนนี้" };

    const imageUrl = await saveImage(file, "proofs");

    await prisma.clickProof.upsert({
      where: {
        dailyLinkId_clickerId: { dailyLinkId: link.id, clickerId: user.id },
      },
      update: { imageUrl },
      create: {
        dailyLinkId: link.id,
        clickerId: user.id,
        workDate,
        imageUrl,
      },
    });

    return { ok: true as const, message: "ส่งงานแล้ว" };
  } catch (error) {
    return { ok: false as const, message: error instanceof Error ? error.message : "ส่งงานไม่สำเร็จ" };
  }
}

export async function getReport(dateISO: string) {
  const user = await requireActiveMember();
  const workDate = asWorkDate(dateISO);

  const myLink = await prisma.dailyLink.findUnique({
    where: { userId_workDate: { userId: user.id, workDate } },
    include: {
      proofs: {
        include: { clicker: { select: { displayName: true, avatarUrl: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const activeMembers = await prisma.user.findMany({
    where: { status: "ACTIVE", role: "MEMBER", id: { not: user.id } },
    select: { id: true, displayName: true, avatarUrl: true },
    orderBy: { displayName: "asc" },
  });

  const clickedIds = new Set(myLink?.proofs.map((proof) => proof.clickerId) ?? []);

  return {
    hasLink: Boolean(myLink),
    clicked: (myLink?.proofs ?? []).map((proof) => ({
      id: proof.id,
      name: proof.clicker.displayName,
      avatarUrl: proof.clicker.avatarUrl,
      at: proof.createdAt.toISOString(),
      imageUrl: proof.imageUrl,
      disputed: proof.disputed,
    })),
    pending: activeMembers
      .filter((member) => !clickedIds.has(member.id))
      .map((member) => ({ name: member.displayName, avatarUrl: member.avatarUrl })),
  };
}

export async function getMyPending(dateISO: string) {
  const user = await requireActiveMember();
  const workDate = asWorkDate(dateISO);

  const [members, links, proofs] = await Promise.all([
    prisma.user.findMany({
      where: { status: "ACTIVE", role: "MEMBER", id: { not: user.id } },
      select: { id: true, displayName: true, avatarUrl: true },
      orderBy: { displayName: "asc" },
    }),
    prisma.dailyLink.findMany({
      where: { workDate, userId: { not: user.id } },
      select: { userId: true, id: true },
    }),
    prisma.clickProof.findMany({
      where: { clickerId: user.id, workDate },
      select: { dailyLink: { select: { userId: true } }, imageUrl: true },
    }),
  ]);

  const linkByOwner = new Map(links.map((link) => [link.userId, link.id]));
  const proofByOwner = new Map(
    proofs.map((proof) => [proof.dailyLink.userId, proof.imageUrl]),
  );

  return members.map((member) => {
    const hasLink = linkByOwner.has(member.id);
    const imageUrl = proofByOwner.get(member.id) ?? null;
    return {
      ownerId: member.id,
      displayName: member.displayName,
      avatarUrl: member.avatarUrl,
      hasLink,
      done: Boolean(imageUrl),
      imageUrl,
    };
  });
}

export async function getGroupStats(mode: "daily" | "monthly", dateISO?: string) {
  await requireActiveMember();
  const settings = await getSettings();
  const today = bangkokDateISO();
  const parts = bangkokParts();

  const members = await prisma.user.findMany({
    where: { status: "ACTIVE", role: "MEMBER" },
    select: { id: true, displayName: true, avatarUrl: true },
  });

  let start: Date;
  let end: Date;
  if (mode === "monthly") {
    const monthStart = `${parts.year}-${String(parts.month).padStart(2, "0")}-01`;
    start = dateFromISO(monthStart);
    end = dateFromISO(today);
  } else {
    const day = dateISO && /^\d{4}-\d{2}-\d{2}$/.test(dateISO) ? dateISO : today;
    start = dateFromISO(day);
    end = dateFromISO(day);
  }

  const [links, proofs] = await Promise.all([
    prisma.dailyLink.findMany({
      where: { workDate: { gte: start, lte: end } },
      select: { userId: true, workDate: true },
    }),
    prisma.clickProof.findMany({
      where: { workDate: { gte: start, lte: end } },
      select: { clickerId: true, workDate: true },
    }),
  ]);

  const linkDays = new Map<string, Set<string>>();
  for (const link of links) {
    const key = link.workDate.toISOString().slice(0, 10);
    const set = linkDays.get(key) ?? new Set<string>();
    set.add(link.userId);
    linkDays.set(key, set);
  }

  const proofCount = new Map<string, number>();
  for (const proof of proofs) {
    proofCount.set(proof.clickerId, (proofCount.get(proof.clickerId) ?? 0) + 1);
  }

  const rows = members.map((member) => {
    let target = 0;
    for (const owners of linkDays.values()) {
      target += Math.max(0, owners.size - (owners.has(member.id) ? 1 : 0));
    }
    const actual = proofCount.get(member.id) ?? 0;
    const percent = target === 0 ? null : Math.min(100, Math.round((actual / target) * 100));
    return {
      id: member.id,
      displayName: member.displayName,
      avatarUrl: member.avatarUrl,
      target,
      actual,
      percent,
    };
  });

  rows.sort((a, b) => {
    const pa = a.percent ?? -1;
    const pb = b.percent ?? -1;
    if (pb !== pa) return pb - pa;
    return b.actual - a.actual;
  });

  const phase = dayPhase(settings.submitHour, settings.proofHour);
  return { rows, phase };
}

export async function submitPayment(formData: FormData) {
  try {
    const user = await requireSessionUser();
    if (user.role === "ADMIN") {
      return { ok: false as const, message: "แอดมินไม่ต้องแจ้งโอน" };
    }

    const monthKey = String(formData.get("monthKey") ?? bangkokMonthKey());
    const file = formData.get("slip") as File | null;
    if (!file) return { ok: false as const, message: "กรุณาแนบสลิป" };

    const existing = await prisma.payment.findUnique({
      where: { userId_monthKey: { userId: user.id, monthKey } },
    });
    if (existing?.status === "APPROVED") {
      return { ok: false as const, message: "รอบบิลนี้ยืนยันแล้ว" };
    }

    const slipUrl = await saveImage(file, "slips");
    await prisma.payment.upsert({
      where: { userId_monthKey: { userId: user.id, monthKey } },
      update: { slipUrl, status: "PENDING", reviewedAt: null },
      create: { userId: user.id, monthKey, slipUrl, status: "PENDING" },
    });

    return { ok: true as const, message: "รับสลิปแล้ว รอแอดมินตรวจ" };
  } catch (error) {
    return { ok: false as const, message: error instanceof Error ? error.message : "ส่งสลิปไม่สำเร็จ" };
  }
}

export async function disputeProof(proofId: string) {
  try {
    const user = await requireActiveMember();
    const proof = await prisma.clickProof.findUnique({
      where: { id: proofId },
      include: { dailyLink: true },
    });
    if (!proof || proof.dailyLink.userId !== user.id) {
      return { ok: false as const, message: "ไม่พบหลักฐานนี้" };
    }
    await prisma.clickProof.update({
      where: { id: proofId },
      data: { disputed: true },
    });
    return { ok: true as const, message: "แจ้งแอดมินแล้วว่าสลิปนี้ไม่ใช่ของเรา" };
  } catch (error) {
    return { ok: false as const, message: error instanceof Error ? error.message : "แจ้งไม่สำเร็จ" };
  }
}

export async function updateMyProfile(formData: FormData) {
  try {
    const user = await requireSessionUser();
    const displayName = String(formData.get("displayName") ?? "").trim();
    const contact = String(formData.get("contact") ?? "").trim();
    if (displayName.length < 2) {
      return { ok: false as const, message: "ใส่ชื่อในกลุ่มอย่างน้อย 2 ตัวอักษร" };
    }

    const taken = await prisma.user.findFirst({
      where: { displayName, id: { not: user.id } },
    });
    if (taken) return { ok: false as const, message: "ชื่อในกลุ่มนี้มีคนใช้แล้ว" };

    const file = formData.get("avatar") as File | null;
    let avatarUrl: string | undefined;
    if (file && file.size > 0) {
      avatarUrl = await saveImage(file, "avatars");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName,
        contact: contact || null,
        ...(avatarUrl ? { avatarUrl } : {}),
      },
    });
    return { ok: true as const, message: "บันทึกโปรไฟล์แล้ว" };
  } catch (error) {
    return { ok: false as const, message: error instanceof Error ? error.message : "บันทึกไม่สำเร็จ" };
  }
}

export async function getMyProfile() {
  const user = await requireSessionUser();
  return prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      username: true,
      displayName: true,
      contact: true,
      avatarUrl: true,
      facebookId: true,
    },
  });
}

export async function getMemberLiveState() {
  return getMemberHomeData();
}

export async function getPaymentLiveState(monthKey?: string) {
  return getPaymentBoard(monthKey);
}
