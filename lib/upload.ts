import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_BYTES = 6 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

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
    throw new Error("รองรับเฉพาะ JPG PNG WEBP");
  }

  const filename = `${Date.now()}-${safeName(file.name)}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`${folder}/${filename}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    return blob.url;
  }

  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), bytes);
  return `/uploads/${folder}/${filename}`;
}
