import { getMyProfile } from "@/actions/member";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Card className="p-6">
        <PageHeader title="โปรไฟล์" description={`ยูสเซอร์เนม ${profile.username}`} />
        <ProfileForm profile={profile} />
      </Card>
    </div>
  );
}
