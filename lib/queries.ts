import { auth } from "@/auth";
import {
  bangkokDateISO,
  bangkokMonthKey,
  dateFromISO,
  dayPhase,
} from "@/lib/bangkok";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/session";
import { publicSettings } from "@/lib/public-settings";
import { monthKeySchema } from "@/lib/validation";

export async function getMemberHomeData() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "MEMBER" || session.user.status !== "ACTIVE") return null;

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
      where: { clickerId: userId, workDate, dailyLink: { userId: { not: userId } } },
    }),
    prisma.clickProof.count({
      where: {
        dailyLink: { userId },
        workDate,
        clickerId: { not: userId },
        clicker: { role: "MEMBER", status: "ACTIVE" },
      },
    }),
  ]);

  const linksToday = await prisma.dailyLink.count({
    where: { workDate, userId: { not: userId }, user: { role: "MEMBER", status: "ACTIVE" } },
  });

  const remaining = Math.max(0, linksToday - proofsDone);
  const phase = dayPhase(settings.submitHour, settings.proofHour);

  return {
    user: {
      ...session.user,
      name: profile?.displayName ?? session.user.name,
      avatarUrl: profile?.avatarUrl ?? null,
    },
    settings: publicSettings(settings),
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
  if (!session?.user?.id || session.user.role !== "MEMBER") return null;

  const settings = await getSettings();
  const key = monthKeySchema.parse(monthKey ?? bangkokMonthKey());

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
    settings: publicSettings(settings),
    monthKey: key,
    isAdmin: false,
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
            ...(session.user.role === "ADMIN" || member.id === session.user.id ? { slipUrl: member.payments[0].slipUrl } : {}),
          }
        : null,
    })),
  };
}
