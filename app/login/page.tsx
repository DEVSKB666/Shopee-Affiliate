import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { Aurora } from "@/components/bits/aurora";
import { GradientText } from "@/components/bits/gradient-text";
import { LoginForm } from "@/components/login-form";
import { Card } from "@/components/ui/card";
import { facebookConfigured } from "@/lib/settings";
import { getSettings } from "@/lib/session";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const settings = await getSettings();
  const facebookEnabled = settings.facebookLoginEnabled && facebookConfigured();

  return (
    <div className="relative min-h-full overflow-hidden bg-canvas">
      <Aurora />
      <div className="relative mx-auto flex min-h-full max-w-md flex-col justify-center px-5 py-16">
        <BrandMark settings={settings} />
        <Card className="mt-8 p-6">
          <p className="text-xs font-semibold tracking-[0.2em] text-mute">LOGIN</p>
          <GradientText as="h1" className="mt-2 text-2xl font-semibold">
            เข้าสู่ระบบ
          </GradientText>
          <p className="mt-1 text-sm text-mute">เข้าด้วยยูสเซอร์เนม หรือ Facebook ถ้าแอดมินเปิดไว้</p>
          <div className="mt-6">
            <LoginForm facebookEnabled={facebookEnabled} />
          </div>
        </Card>
        <Link href="/" className="mt-6 inline-flex items-center justify-center gap-2 text-sm text-mute">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          กลับไปสมัครสมาชิก
        </Link>
      </div>
    </div>
  );
}
