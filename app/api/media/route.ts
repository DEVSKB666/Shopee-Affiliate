import { get } from "@vercel/blob";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isStaffRole } from "@/lib/session";
import { privateMediaUrl } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validPathname(pathname: string) {
  return Boolean(
    pathname &&
      !pathname.startsWith("/") &&
      !pathname.includes("..") &&
      !pathname.includes("\\") &&
      !pathname.includes("?") &&
      !pathname.includes("#"),
  );
}

async function canRead(pathname: string) {
  const session = await auth();
  const mediaUrl = privateMediaUrl(pathname);

  const [settings, avatarOwner, proof, payment] = await Promise.all([
    prisma.setting.findUnique({
      where: { id: "default" },
      select: { logoUrl: true, faviconUrl: true, heroImageUrl: true, qrImageUrl: true },
    }),
    prisma.user.findFirst({ where: { avatarUrl: mediaUrl }, select: { id: true } }),
    prisma.clickProof.findFirst({
      where: { imageUrl: mediaUrl },
      select: { clickerId: true, dailyLink: { select: { userId: true } } },
    }),
    prisma.payment.findFirst({ where: { slipUrl: mediaUrl }, select: { userId: true } }),
  ]);

  if ([settings?.logoUrl, settings?.faviconUrl, settings?.heroImageUrl].includes(mediaUrl)) {
    return true;
  }

  if (!session?.user?.id || session.user.status === "BANNED") return false;
  if (settings?.qrImageUrl === mediaUrl) return true;
  if (isStaffRole(session.user.role)) return true;
  if (avatarOwner) return true;
  if (proof && (proof.clickerId === session.user.id || proof.dailyLink.userId === session.user.id)) {
    return true;
  }
  return payment?.userId === session.user.id;
}

export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get("pathname") ?? "";
  if (!validPathname(pathname)) {
    return NextResponse.json({ error: "Invalid media path" }, { status: 400 });
  }

  if (!(await canRead(pathname))) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const result = await get(pathname, {
      access: "private",
      ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
    });

    if (!result) {
      return new NextResponse("Not found", { status: 404 });
    }

    if (result.statusCode === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: result.blob.etag,
          "Cache-Control": "private, no-store",
        },
      });
    }

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType,
        "Content-Length": String(result.blob.size),
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
        ETag: result.blob.etag,
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
