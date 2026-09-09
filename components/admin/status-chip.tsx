import { Chip } from "@/components/ui/chip";

const MEMBER_STATUS = {
  ACTIVE: { label: "ใช้งาน", tone: "jade" as const },
  PENDING: { label: "รออนุมัติ", tone: "gold" as const },
  INACTIVE: { label: "พักไอดี", tone: "gold" as const },
  BANNED: { label: "แบน", tone: "flame" as const },
};

export function StatusChip({ status }: { status: string }) {
  const item = MEMBER_STATUS[status as keyof typeof MEMBER_STATUS];
  if (!item) return <Chip>{status}</Chip>;
  return <Chip tone={item.tone}>{item.label}</Chip>;
}
