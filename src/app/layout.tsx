import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import { getSiteUrl } from "@/lib/site";
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

const SITE_TITLE =
  "أسعار المحاصيل اليوم في السودان | بورصة القضارف للذرة والسمسم والدخن";
const SITE_DESCRIPTION =
  "متابعة يومية محدثة لأسعار الذرة اليوم في القضارف (سعر أردب الفتريتة والدبر والعكر والدخن)، وسعر قنطار السمسم الأبيض والتسالي وزهرة الشمس، مع كميات الوارد بالجوال في بورصة المحاصيل السودانية وسوق محصول القضارف وبورتسودان والأبيض وتندلتي.";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: [
    "أسعار الذرة اليوم في القضارف",
    "سعر أردب الفتريتة والدبر",
    "سعر قنطار السمسم الأبيض",
    "بورصة المحاصيل السودانية",
    "سوق محصول القضارف",
    "أسعار المحاصيل اليوم في السودان",
    "سعر الدخن في القضارف",
    "سعر التسالي في السودان",
    "بورصة القضارف",
  ],
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "RuIOvIJ1RRQcVh1oztObRVEb7X4RUnA3oTS2-3DHvnA",
  },
  openGraph: {
    type: "website",
    locale: "ar_SD",
    siteName: "بورصة المحاصيل الزراعية في السودان - القضارف",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "أسعار المحاصيل اليوم في السودان — بورصة القضارف للذرة والسمسم والدخن",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
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
