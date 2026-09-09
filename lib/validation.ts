import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 4;
export const passwordSchema = z.string().min(PASSWORD_MIN_LENGTH, "รหัสผ่านอย่างน้อย 4 ตัวอักษร");
export const IMAGE_MAX_BYTES = 6 * 1024 * 1024;
export const FORM_IMAGE_MAX_BYTES = 7 * 1024 * 1024;
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function imageFileError(file: { size: number; type: string }) {
  if (!file.size) return "กรุณาเลือกไฟล์รูปที่ไม่ว่างเปล่า";
  if (file.size > IMAGE_MAX_BYTES) return "รูปใหญ่เกิน 6 MB กรุณาเลือกรูปที่เล็กลง";
  if (!IMAGE_ACCEPT.split(",").includes(file.type)) return "รองรับ JPG, PNG, WEBP และ GIF เท่านั้น";
  return null;
}

export function assertImageFormSize(form: FormData) {
  let total = 0;
  for (const value of form.values()) if (value instanceof File) total += value.size;
  if (total > FORM_IMAGE_MAX_BYTES) throw new Error("รูปทั้งหมดในฟอร์มต้องมีขนาดรวมไม่เกิน 7 MB");
}

export const monthKeySchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "รอบเดือนไม่ถูกต้อง");
