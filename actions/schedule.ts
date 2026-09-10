"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { scheduleFields, scheduleSchema } from "@/lib/schedule";

export async function saveSchedule(form: FormData) {
  try {
    await requireAdmin();
    const parsed = scheduleSchema.safeParse({ submitTime: form.get("submitTime"), proofTime: form.get("proofTime") });
    if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0].message };
    const data = scheduleFields(parsed.data.submitTime, parsed.data.proofTime);
    await prisma.setting.upsert({ where: { id: "default" }, update: data, create: { id: "default", ...data } });
    revalidatePath("/", "layout");
    return { ok: true as const, message: "บันทึกเวลาแล้ว มีผลทันที", ...parsed.data };
  } catch (error) {
    return { ok: false as const, message: error instanceof Error ? error.message : "บันทึกไม่สำเร็จ กรุณาลองใหม่" };
  }
}
