import { countMembers, listMembers } from "@/actions/admin";
import { MembersManager } from "@/components/admin/members-manager";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  const [rows, counts, session] = await Promise.all([listMembers(), countMembers(), auth()]);
  return <MembersManager initialRows={rows} initialCounts={counts} canManage={session?.user.role === "ADMIN"} />;
}
