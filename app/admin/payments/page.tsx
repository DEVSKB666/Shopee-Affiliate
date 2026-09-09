import { listPayments } from "@/actions/admin";
import { PaymentsManager } from "@/components/admin/payments-manager";
import { bangkokMonthKey } from "@/lib/bangkok";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const monthKey = bangkokMonthKey();
  const rows = await listPayments(monthKey);
  return <PaymentsManager initialRows={rows} initialMonth={monthKey} />;
}
