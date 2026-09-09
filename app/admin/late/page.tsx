import { getLateBoard, listDisputedProofs } from "@/actions/admin";
import { auth } from "@/auth";
import { LateBoard } from "@/components/admin/late-board";
import { bangkokDateISO } from "@/lib/bangkok";

export const dynamic = "force-dynamic";

export default async function AdminLatePage() {
  const date = bangkokDateISO();
  const [rows, disputed, session] = await Promise.all([getLateBoard(date), listDisputedProofs(), auth()]);
  return <LateBoard initialRows={rows} initialDisputed={disputed} initialDate={date} canManage={session?.user.role === "ADMIN"} />;
}
