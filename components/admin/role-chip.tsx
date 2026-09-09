import { Chip } from "@/components/ui/chip";

const ROLES = {
  ADMIN: { label: "Admin", tone: "flame" as const },
  MODERATOR: { label: "ผู้ตรวจสอบ", tone: "sky" as const },
  MEMBER: { label: "สมาชิก", tone: "jade" as const },
};

export function RoleChip({ role }: { role: string }) {
  const item = ROLES[role as keyof typeof ROLES];
  return <Chip tone={item?.tone}>{item?.label ?? role}</Chip>;
}

