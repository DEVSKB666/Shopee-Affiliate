import { MemberWorkspace } from "@/components/member-workspace";
import { getMemberHomeData } from "@/lib/queries";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function MemberHomePage() {
  const session = await auth();
  if (session?.user.role === "ADMIN" || session?.user.role === "MODERATOR") redirect("/admin");
  const data = await getMemberHomeData();
  if (!data) redirect("/");

  return <MemberWorkspace data={data} />;
}
