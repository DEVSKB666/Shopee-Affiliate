import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  const needsAuth =
    pathname.startsWith("/app") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/pending");

  if (needsAuth && !user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/admin") && user?.role !== "ADMIN" && user?.role !== "MODERATOR") {
    return NextResponse.redirect(new URL("/app", req.url));
  }

  if (pathname.startsWith("/admin/settings") && user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  if (pathname.startsWith("/app") && (user?.role === "ADMIN" || user?.role === "MODERATOR")) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  if (
    pathname.startsWith("/app") &&
    user &&
    user.role !== "ADMIN" &&
    user.role !== "MODERATOR" &&
    user.status !== "ACTIVE" &&
    !pathname.startsWith("/app/pay") &&
    !pathname.startsWith("/app/profile")
  ) {
    return NextResponse.redirect(new URL("/pending", req.url));
  }

  if (
    pathname.startsWith("/pending") &&
    user &&
    (user.status === "ACTIVE" || user.role === "ADMIN" || user.role === "MODERATOR")
  ) {
    return NextResponse.redirect(new URL(user.role === "ADMIN" || user.role === "MODERATOR" ? "/admin" : "/app", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/app/:path*", "/admin/:path*", "/pending"],
};
