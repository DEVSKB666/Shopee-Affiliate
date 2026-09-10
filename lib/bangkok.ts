const TZ = "Asia/Bangkok";

const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

export function bangkokDateISO(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function dateFromISO(iso: string) {
  return new Date(`${iso}T00:00:00.000Z`);
}

export function bangkokParts(date = new Date()) {
  const raw = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    raw.find((part) => part.type === type)?.value ?? "0";

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    second: Number(get("second")),
  };
}

export function bangkokMonthKey(date = new Date()) {
  const { year, month } = bangkokParts(date);
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function thaiDateLabel(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return `${day} ${THAI_MONTHS[(month ?? 1) - 1]} ${year + 543}`;
}

export function thaiMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return `${THAI_MONTHS[(month ?? 1) - 1]} ${year + 543}`;
}

export function padTime(hour: number, minute = 0) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export type DayPhase = "submit" | "click" | "closed";

export type DayPhaseState = {
  phase: DayPhase;
  secondsLeft: number;
  minutesLeft: number;
  windowSeconds: number;
  windowMinutes: number;
  nextLabel: string;
};

export function dayPhase(submitHour: number, proofHour: number, date = new Date(), submitMinute = 0, proofMinute = 0): DayPhaseState {
  const { hour, minute, second } = bangkokParts(date);
  const now = hour * 3600 + minute * 60 + second;
  const submitAt = (submitHour * 60 + submitMinute) * 60;
  const proofAt = (proofHour * 60 + proofMinute) * 60;

  if (now < submitAt) {
    const secondsLeft = submitAt - now;
    return {
      phase: "submit",
      secondsLeft,
      minutesLeft: Math.ceil(secondsLeft / 60),
      windowSeconds: submitAt,
      windowMinutes: submitAt / 60,
      nextLabel: `ส่งลิงก์ถึง ${padTime(submitHour, submitMinute)}`,
    };
  }

  if (now < proofAt) {
    const secondsLeft = proofAt - now;
    return {
      phase: "click",
      secondsLeft,
      minutesLeft: Math.ceil(secondsLeft / 60),
      windowSeconds: proofAt - submitAt,
      windowMinutes: (proofAt - submitAt) / 60,
      nextLabel: `กดคืนถึง ${padTime(proofHour, proofMinute)}`,
    };
  }

  return {
    phase: "closed",
    secondsLeft: 0,
    minutesLeft: 0,
    windowSeconds: 24 * 3600 - proofAt,
    windowMinutes: (24 * 3600 - proofAt) / 60,
    nextLabel: "วันนี้หมดเวลาแล้ว",
  };
}

export function formatCountdown(totalSeconds: number) {
  const value = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const seconds = value % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

export function formatBangkokClock(date = new Date()) {
  const { hour, minute, second } = bangkokParts(date);
  return [hour, minute, second].map((part) => String(part).padStart(2, "0")).join(":");
}

export function formatMinutes(total: number) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours <= 0) return `${minutes} นาที`;
  return `${hours} ชม. ${minutes} นาที`;
}
