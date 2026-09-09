import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Facebook from "next-auth/providers/facebook";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/session";
import { assertCanRegister, facebookConfigured, newMemberStatus } from "@/lib/settings";

const facebook = facebookConfigured()
  ? [
      Facebook({
        clientId: process.env.AUTH_FACEBOOK_ID,
        clientSecret: process.env.AUTH_FACEBOOK_SECRET,
      }),
    ]
  : [];

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "username", type: "text" },
        password: { label: "password", type: "password" },
      },
      async authorize(credentials) {
        const username = String(credentials?.username ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!username || !password) return null;

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user?.passwordHash) return null;
        if (user.status === "BANNED") return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.displayName,
          email: user.username,
          role: user.role,
          status: user.status,
          username: user.username,
        };
      },
    }),
    ...facebook,
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ account, profile }) {
      if (account?.provider !== "facebook") return true;

      const settings = await getSettings();
      if (!settings.facebookLoginEnabled || !facebookConfigured()) {
        return "/login?error=facebook-off";
      }

      const facebookId = account.providerAccountId;
      const picture =
        typeof profile === "object" && profile && "picture" in profile
          ? String((profile as { picture?: { data?: { url?: string } } }).picture?.data?.url ?? "")
          : "";
      const name =
        (typeof profile === "object" && profile && "name" in profile
          ? String((profile as { name?: string }).name ?? "")
          : "") || "สมาชิก Facebook";

      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            { facebookId },
            { accounts: { some: { provider: "facebook", providerAccountId: facebookId } } },
          ],
        },
      });

      if (existing) {
        if (existing.status === "BANNED") return false;
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            facebookId,
            avatarUrl: existing.avatarUrl || picture || undefined,
            accounts: {
              connectOrCreate: {
                where: {
                  provider_providerAccountId: {
                    provider: "facebook",
                    providerAccountId: facebookId,
                  },
                },
                create: { provider: "facebook", providerAccountId: facebookId },
              },
            },
          },
        });
        return true;
      }

      try {
        await assertCanRegister(settings);
      } catch {
        return "/login?error=register-closed";
      }

      await prisma.user.create({
        data: {
          username: `fb_${facebookId.slice(-12)}`,
          displayName: name.slice(0, 40),
          facebookId,
          avatarUrl: picture || null,
          passwordHash: null,
          status: newMemberStatus(settings),
          accounts: {
            create: { provider: "facebook", providerAccountId: facebookId },
          },
        },
      });

      return true;
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "facebook") {
        const dbUser = await prisma.user.findFirst({
          where: { facebookId: account.providerAccountId },
        });
        if (dbUser) {
          token.sub = dbUser.id;
          token.role = dbUser.role;
          token.status = dbUser.status;
          token.username = dbUser.username;
          token.name = dbUser.displayName;
        }
        return token;
      }

      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.status = user.status;
        token.username = user.username;
      }
      if (!token.sub) return null;
      const current = await prisma.user.findUnique({
        where: { id: token.sub },
        select: { role: true, status: true, username: true, displayName: true },
      });
      if (!current || current.status === "BANNED") return null;
      token.role = current.role;
      token.status = current.status;
      token.username = current.username;
      token.name = current.displayName;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as "ADMIN" | "MODERATOR" | "MEMBER") ?? "MEMBER";
        session.user.status =
          (token.status as "PENDING" | "ACTIVE" | "INACTIVE" | "BANNED") ?? "PENDING";
        session.user.username = String(token.username ?? "");
        session.user.name = token.name;
      }
      return session;
    },
  },
});
