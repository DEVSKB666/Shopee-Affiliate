import { getAdminOverview, listDisputedProofs } from "@/actions/admin";
import { AdminOverviewLive } from "@/components/admin/overview-live";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const [data, disputed] = await Promise.all([getAdminOverview(), listDisputedProofs()]);
  return <AdminOverviewLive initial={data} initialDisputed={disputed} />;
}
