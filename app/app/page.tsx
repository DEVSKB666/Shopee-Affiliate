import { MemberWorkspace } from "@/components/member-workspace";
import { getMemberHomeData } from "@/lib/queries";
import { redirect } from "next/navigation";

export default async function MemberHomePage() {
  const data = await getMemberHomeData();
  if (!data) redirect("/");

  return <MemberWorkspace data={data} />;
}
