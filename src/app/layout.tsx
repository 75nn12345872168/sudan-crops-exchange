import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "بورصة المحاصيل الزراعية في السودان - القضارف | Sudan Crops Exchange",
  description:
    "منصة متابعة الأسعار اليومية والوارد للمحاصيل الزراعية في السودان: القضارف، بورتسودان صادر، الأبيض، وتندلتي (الذرة، السمسم، الدخن، التسالي، الفول السوداني).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${ibmPlexArabic.variable} ${ibmPlexMono.variable}`}
    >
      <body className="min-h-screen font-sans antialiased selection:bg-emerald-200 selection:text-emerald-950">
        {children}
      </body>
    </html>
  );
}
