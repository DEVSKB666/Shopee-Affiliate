import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { privateMediaUrl } from "@/lib/media";

const MAX_BYTES = 6 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

async function hasImageSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const starts = (values: number[], offset = 0) => values.every((value, index) => bytes[offset + index] === value);
  if (file.type === "image/jpeg") return starts([0xff, 0xd8, 0xff]);
  if (file.type === "image/png") return starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (file.type === "image/gif") return starts([0x47, 0x49, 0x46, 0x38]);
  if (file.type === "image/webp") return starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8);
  return false;
}

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "image";
}

export async function saveImage(file: File, folder: string) {
  if (!file || file.size === 0) {
    throw new Error("กรุณาแนบรูปภาพ");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("ไฟล์ใหญ่เกิน 6MB");
  }
  if (!ALLOWED.has(file.type)) {
    throw new Error("รองรับเฉพาะ JPG PNG WEBP และ GIF");
  }
  if (!(await hasImageSignature(file))) {
    throw new Error("ไฟล์นี้ไม่ใช่รูปภาพที่ถูกต้อง");
  }

  const filename = `${Date.now()}-${safeName(file.name)}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`${folder}/${filename}`, file, {
      access: "private",
      addRandomSuffix: true,
    });
    return privateMediaUrl(blob.pathname);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("ระบบอัปโหลดบน Production ยังไม่ได้ตั้งค่า BLOB_READ_WRITE_TOKEN");
  }

  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), bytes);
  return `/uploads/${folder}/${filename}`;
}
