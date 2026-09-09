import { countMembers, listMembers } from "@/actions/admin";
import { MembersManager } from "@/components/admin/members-manager";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  const [rows, counts] = await Promise.all([listMembers(), countMembers()]);
  return <MembersManager initialRows={rows} initialCounts={counts} />;
}
