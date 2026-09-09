import { getLateBoard, listDisputedProofs } from "@/actions/admin";
import { LateBoard } from "@/components/admin/late-board";
import { bangkokDateISO } from "@/lib/bangkok";

export const dynamic = "force-dynamic";

export default async function AdminLatePage() {
  const date = bangkokDateISO();
  const [rows, disputed] = await Promise.all([getLateBoard(date), listDisputedProofs()]);
  return <LateBoard initialRows={rows} initialDisputed={disputed} initialDate={date} />;
}
