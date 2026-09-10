import { z } from "zod";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "กรุณาเลือกเวลาให้ครบทั้งชั่วโมงและนาที");
export const scheduleSchema = z.object({ submitTime: time, proofTime: time }).refine(
  ({ submitTime, proofTime }) => submitTime < proofTime,
  { message: "เวลาปิดรับหลักฐานต้องอยู่หลังเวลาปิดรับลิงก์ในวันเดียวกัน", path: ["proofTime"] },
);

export function scheduleFields(submitTime: string, proofTime: string) {
  const [submitHour, submitMinute] = submitTime.split(":").map(Number);
  const [proofHour, proofMinute] = proofTime.split(":").map(Number);
  return { submitHour, submitMinute, proofHour, proofMinute };
}
