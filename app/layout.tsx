import type { Metadata } from "next";
import { Anuphan, IBM_Plex_Mono, Taviraj } from "next/font/google";
import { Providers } from "@/components/providers";
import { getSettings } from "@/lib/session";
import "./globals.css";

const anuphan = Anuphan({
  subsets: ["latin", "thai"],
  variable: "--font-anuphan",
  weight: ["300", "400", "500", "600", "700"],
});

const taviraj = Taviraj({
  subsets: ["latin", "thai"],
  variable: "--font-taviraj",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const plex = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex",
  weight: ["400", "500"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings().catch(() => null);
  return {
    title: settings?.metaTitle || "Support Link — Shopee Affiliate",
    description: settings?.metaDescription || "กลุ่มแลกเปลี่ยนลิงก์ Shopee Affiliate",
    icons: settings?.faviconUrl ? [{ url: settings.faviconUrl }] : undefined,
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${anuphan.variable} ${taviraj.variable} ${plex.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-canvas font-sans text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
