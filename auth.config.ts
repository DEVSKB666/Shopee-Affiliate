import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.status = user.status;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as "ADMIN" | "MEMBER") ?? "MEMBER";
        session.user.status =
          (token.status as "PENDING" | "ACTIVE" | "INACTIVE" | "BANNED") ?? "PENDING";
        session.user.username = String(token.username ?? "");
        session.user.name = token.name;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
