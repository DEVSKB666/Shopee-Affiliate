import { auth } from "@/auth";
import {
  bangkokDateISO,
  bangkokMonthKey,
  dateFromISO,
  dayPhase,
} from "@/lib/bangkok";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/session";

export async function getMemberHomeData() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const settings = await getSettings();
  const today = bangkokDateISO();
  const workDate = dateFromISO(today);
  const userId = session.user.id;

  const [profile, myLink, activeMembers, proofsDone, proofsForMe] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true, displayName: true },
    }),
    prisma.dailyLink.findUnique({
      where: { userId_workDate: { userId, workDate } },
    }),
    prisma.user.count({
      where: { status: "ACTIVE", role: "MEMBER" },
    }),
    prisma.clickProof.count({
      where: { clickerId: userId, workDate },
    }),
    prisma.clickProof.count({
      where: { dailyLink: { userId }, workDate },
    }),
  ]);

  const linksToday = await prisma.dailyLink.count({
    where: { workDate, userId: { not: userId } },
  });

  const remaining = Math.max(0, linksToday - proofsDone);
  const phase = dayPhase(settings.submitHour, settings.proofHour);

  return {
    user: {
      ...session.user,
      name: profile?.displayName ?? session.user.name,
      avatarUrl: profile?.avatarUrl ?? null,
    },
    settings,
    today,
    myLink: myLink
      ? { id: myLink.id, title: myLink.title, url: myLink.url }
      : null,
    remaining,
    proofsDone,
    proofsForMe,
    linksToday,
    memberCount: activeMembers,
    phase,
  };
}

export async function getPaymentBoard(monthKey?: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const settings = await getSettings();
  const key = monthKey ?? bangkokMonthKey();

  const members = await prisma.user.findMany({
    where: { role: "MEMBER", status: { in: ["PENDING", "ACTIVE", "INACTIVE"] } },
    orderBy: { displayName: "asc" },
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      status: true,
      payments: {
        where: { monthKey: key },
        take: 1,
      },
    },
  });

  return {
    settings,
    monthKey: key,
    isAdmin: session.user.role === "ADMIN",
    currentUserId: session.user.id,
    rows: members.map((member) => ({
      userId: member.id,
      displayName: member.displayName,
      avatarUrl: member.avatarUrl,
      userStatus: member.status,
      payment: member.payments[0]
        ? {
            id: member.payments[0].id,
            status: member.payments[0].status,
            slipUrl: member.payments[0].slipUrl,
          }
        : null,
    })),
  };
}
