import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { Aurora } from "@/components/bits/aurora";
import { GradientText } from "@/components/bits/gradient-text";
import { RegisterForm } from "@/components/register-form";
import { Card } from "@/components/ui/card";
import { getSettings } from "@/lib/session";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const settings = await getSettings();
  return (
    <div className="relative min-h-full overflow-hidden bg-canvas">
      <Aurora />
      <div className="relative mx-auto max-w-md px-5 py-12">
        <BrandMark settings={settings} />
        <Card className="mt-8 p-6">
          <GradientText as="h1" className="text-2xl font-semibold">
            ลงทะเบียนสมาชิก
          </GradientText>
          <div className="mt-6">
            <RegisterForm inviteRequired={settings.inviteCodeRequired} contactNote={settings.contactNote} />
          </div>
          <Link href="/login" className="mt-4 inline-flex w-full items-center justify-center gap-2 text-sm text-flame">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </Card>
      </div>
    </div>
  );
}
