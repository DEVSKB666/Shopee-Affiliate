import { listPayments } from "@/actions/admin";
import { auth } from "@/auth";
import { PaymentsManager } from "@/components/admin/payments-manager";
import { bangkokMonthKey } from "@/lib/bangkok";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const monthKey = bangkokMonthKey();
  const [rows, session] = await Promise.all([listPayments(monthKey), auth()]);
  return <PaymentsManager initialRows={rows} initialMonth={monthKey} canManage={session?.user.role === "ADMIN"} />;
}
