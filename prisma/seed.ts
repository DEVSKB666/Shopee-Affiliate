import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const adminPass = process.env.ADMIN_PASSWORD ?? "Admin1234!";
  const memberPass = "Demo1234!";
  const adminHash = await bcrypt.hash(adminPass, 10);
  const memberHash = await bcrypt.hash(memberPass, 10);

  await prisma.setting.upsert({
    where: { id: "default" },
    update: {
      siteName: "Support Link",
      tagline: "กลุ่มแลกเปลี่ยนลิงก์ Shopee Affiliate",
    },
    create: { id: "default" },
  });

  await prisma.user.upsert({
    where: { username: "admin" },
    update: { passwordHash: adminHash, role: "ADMIN", status: "ACTIVE", displayName: "แอดมิน" },
    create: {
      username: "admin",
      displayName: "แอดมิน",
      passwordHash: adminHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  const demos = [
    { username: "mira", displayName: "มิระ ตลาดนัด", contact: "line: mira.click" },
    { username: "pong", displayName: "ปอง เสื้อยืด", contact: "line: pongtee" },
    { username: "nicha", displayName: "ณิชา สกินแคร์", contact: "ig: nicha.shop" },
    { username: "beam", displayName: "บีม กาแฟถุง", contact: "line: beamcoffee" },
  ];

  for (const demo of demos) {
    await prisma.user.upsert({
      where: { username: demo.username },
      update: {},
      create: {
        ...demo,
        passwordHash: memberHash,
        role: "MEMBER",
        status: "ACTIVE",
      },
    });
  }

  console.log("Seeded admin / Admin1234! and demo members / Demo1234!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
