import { BrandMark } from "@/components/brand";
import { AdminNav } from "@/components/admin/nav";
import { LiveClock } from "@/components/live-clock";
import { getSettings } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <div className="admin-shell">
      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6">
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-6 rounded-3xl border border-border bg-paper-2/90 p-4 shadow-[var(--shadow-card)] backdrop-blur">
            <BrandMark settings={settings} compact />
            <p className="mt-1 text-[11px] text-mute">แผงควบคุมแอดมิน</p>
            <LiveClock className="mt-2 text-[11px] text-mute" />
            <AdminNav />
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <AdminNav compact />
          {children}
        </div>
      </div>
    </div>
  );
}
