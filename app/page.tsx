import { auth } from '@/auth';
import { Aurora } from '@/components/bits/aurora';
import { GradientText } from '@/components/bits/gradient-text';
import { Magnet } from '@/components/bits/magnet';
import { SplitText } from '@/components/bits/split-text';
import { SpotlightCard } from '@/components/bits/spotlight-card';
import { BrandMark } from '@/components/brand';
import { RegisterForm } from '@/components/register-form';
import { Card } from '@/components/ui/card';
import { getSettings } from '@/lib/session';
import { facebookConfigured } from '@/lib/settings';
import {
  BarChart3,
  MousePointerClick,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await auth();
  const settings = await getSettings();
  const facebookOn = settings.facebookLoginEnabled && facebookConfigured();

  return (
    <div className="relative min-h-full overflow-hidden bg-canvas">
      <Aurora />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-8 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-16">
        <section>
          <div className="mb-8 flex items-center justify-between">
            <BrandMark settings={settings} />
            {session?.user ? (
              <Link
                href={session.user.role === 'ADMIN' ? '/admin' : '/app'}
                className="inline-flex min-h-11 items-center rounded-full bg-flame px-4 text-sm font-semibold text-white"
              >
                ไปแอป
              </Link>
            ) : (
              <Link href="/login" className="text-sm font-semibold text-flame">
                เข้าสู่ระบบ
              </Link>
            )}
          </div>
          <GradientText
            as="p"
            className="text-xs font-semibold tracking-[0.22em]"
          >
            SHOPEE AFFILIATE
          </GradientText>
          <SplitText
            text={settings.heroTitle || 'Shopee Affiliate'}
            className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-5xl"
          />
          <p className="mt-4 max-w-lg text-base leading-7 text-mute">
            {settings.heroSubtitle ||
              'ระบบแลกคลิกที่โปร่งใส เช็กได้ว่าใครกดจริง'}
          </p>
          {settings.heroImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.heroImageUrl}
              alt=""
              className="mt-6 max-h-52 rounded-3xl object-cover"
            />
          ) : null}
          <div className="mt-8 grid gap-3">
            <SpotlightCard>
              <div className="flex items-start gap-3">
                <BarChart3 className="mt-0.5 h-5 w-5 text-sky" aria-hidden />
                <div>
                  <p className="font-semibold">ระบบสถิติโปร่งใส 100%</p>
                  <p className="mt-1 text-sm text-mute">
                    ดูได้ทันทีว่าใครกด ใครอู้ มีเปอร์เซ็นต์สรุปยอดกลุ่ม
                  </p>
                </div>
              </div>
            </SpotlightCard>
            <SpotlightCard>
              <div className="flex items-start gap-3">
                <MousePointerClick
                  className="mt-0.5 h-5 w-5 text-flame"
                  aria-hidden
                />
                <div>
                  <p className="font-semibold">กดส่งงานง่าย ประหยัดเวลา</p>
                  <p className="mt-1 text-sm text-mute">
                    รวมลิงก์ไว้ที่เดียว มีปุ่มวาร์ปไปงานค้างทันที
                  </p>
                </div>
              </div>
            </SpotlightCard>
            <SpotlightCard>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-jade" aria-hidden />
                <div>
                  <p className="font-semibold">คัดคนเอาเปรียบออกจากกลุ่ม</p>
                  <p className="mt-1 text-sm text-mute">
                    ใบเหลืองใบแดง ตั้งเกณฑ์ได้จากหลังบ้าน
                  </p>
                </div>
              </div>
            </SpotlightCard>
          </div>
          <div className="mt-6 rounded-3xl border border-dashed border-flame/40 bg-flame/10 p-4">
            <p className="font-semibold text-flame">
              {settings.requirePayment
                ? `ระบบกลุ่มพรีเมียม (${settings.fee}.- / เดือน)`
                : 'ตอนนี้เปิดใช้ฟรี ไม่ต้องโอนก่อน'}
            </p>
            <p className="mt-1 text-sm text-mute">{settings.tagline}</p>
          </div>
        </section>

        <Card className="relative z-10 p-6 shadow-xl sm:p-8">
          <p className="text-xs font-semibold tracking-[0.2em] text-mute">
            REGISTER
          </p>
          <GradientText as="h2" className="mt-2 text-2xl font-semibold">
            ลงทะเบียนสมาชิก
          </GradientText>
          <p className="mt-1 text-sm text-mute">
            {settings.requirePayment
              ? `เข้าร่วมกลุ่มแลกเปลี่ยนลิงก์ ${settings.fee}.- / เดือน`
              : 'สมัครแล้วรอแอดมิน หรือใช้ได้ทันทีตามที่ตั้งค่า'}
          </p>
          <div className="mt-6">
            <RegisterForm
              inviteRequired={settings.inviteCodeRequired}
              contactNote={settings.contactNote}
            />
          </div>
          {facebookOn ? (
            <p className="mt-4 text-center text-xs text-mute">
              สมัครด้วย Facebook ได้ที่หน้าเข้าสู่ระบบ
            </p>
          ) : null}
          <Magnet className="mt-5">
            <Link
              href="/app/pay"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-jade text-sm font-semibold text-white"
            >
              <Wallet className="h-4 w-4" aria-hidden />
              โอนเงินสนับสนุนค่าระบบ รายเดือน
            </Link>
          </Magnet>
        </Card>
      </div>
    </div>
  );
}
