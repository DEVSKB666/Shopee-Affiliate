import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      username: string;
      role: "ADMIN" | "MEMBER";
      status: "PENDING" | "ACTIVE" | "INACTIVE" | "BANNED";
    };
  }

  interface User {
    role: "ADMIN" | "MEMBER";
    status: "PENDING" | "ACTIVE" | "INACTIVE" | "BANNED";
    username: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "ADMIN" | "MEMBER";
    status?: "PENDING" | "ACTIVE" | "INACTIVE" | "BANNED";
    username?: string;
  }
}
