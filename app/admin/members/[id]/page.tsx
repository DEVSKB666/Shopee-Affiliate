import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getMemberDetail } from "@/actions/admin";
import { MemberEditor } from "@/components/admin/member-editor";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const member = await getMemberDetail(id);
  if (!member || (member.role !== "MEMBER" && member.role !== "MODERATOR")) notFound();

  return (
    <div className="space-y-4">
      <Link href="/admin/members" className="inline-flex min-h-11 items-center gap-2 text-sm text-flame">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        รายชื่อสมาชิก
      </Link>
      <MemberEditor
        canManage={session?.user.role === "ADMIN"}
        member={{
          id: member.id,
          displayName: member.displayName,
          username: member.username,
          contact: member.contact ?? "",
          adminNote: member.adminNote ?? "",
          status: member.status,
          role: member.role,
          warnCount: member.warnCount,
          avatarUrl: member.avatarUrl,
          facebookId: member.facebookId,
          createdAt: member.createdAt.toISOString(),
          providers: member.accounts.map((account) => account.provider),
          payments: member.payments.map((payment) => ({
            id: payment.id,
            monthKey: payment.monthKey,
            status: payment.status,
          })),
          links: member.links.map((link) => ({
            id: link.id,
            title: link.title,
            url: link.url,
            workDate: link.workDate.toISOString().slice(0, 10),
          })),
        }}
      />
    </div>
  );
}
