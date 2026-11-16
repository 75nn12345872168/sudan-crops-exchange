import ExchangeDashboard from "@/components/ExchangeDashboard";
import { fetchLatestCropPrices } from "@/lib/crops";
import { getSiteUrl } from "@/lib/site";
import { CROP_CATEGORIES, MARKET_CITIES } from "@/lib/types";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams?: {
    city?: string;
    category?: string;
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { crops, latestDate, isMock } = await fetchLatestCropPrices();
  const siteUrl = getSiteUrl();

  const rawCity = searchParams?.city?.trim();
  const initialCity =
    rawCity && (MARKET_CITIES as readonly string[]).includes(rawCity)
      ? rawCity
      : "الكل";

  const rawCategory = searchParams?.category?.trim();
  const initialCategory =
    rawCategory && (CROP_CATEGORIES as readonly string[]).includes(rawCategory)
      ? rawCategory
      : "الكل";

  const cropNames = Array.from(new Set(crops.map((c) => c.crop_name)));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "بورصة المحاصيل الزراعية في السودان - القضارف",
        alternateName: "Sudan Crops Exchange",
        inLanguage: "ar-SD",
        description:
          "منصة يومية لمتابعة أسعار الذرة والسمسم والدخن والتسالي وكميات الوارد بالجوال في أسواق محاصيل القضارف والسودان.",
      },
      {
        "@type": "Dataset",
        "@id": `${siteUrl}/#dataset`,
        name: "نشرة الأسعار اليومية للمحاصيل الزراعية في القضارف والسودان",
        description:
          "بيانات يومية محدثة لأسعار المحاصيل الزراعية في سوق محصول القضارف والأسواق السودانية (أعلى سعر، أدنى سعر، متوسط السعر بالجنيه السوداني SDG، نسبة التغيّر اليومي، وكمية الوارد بالجوال).",
        url: siteUrl,
        inLanguage: "ar",
        isAccessibleForFree: true,
        dateModified: latestDate,
        temporalCoverage: latestDate,
        spatialCoverage: {
          "@type": "Place",
          name: "القضارف، السودان",
          address: {
            "@type": "PostalAddress",
            addressLocality: "القضارف",
            addressCountry: "SD",
          },
        },
        keywords: [
          "أسعار الذرة اليوم في القضارف",
          "سعر أردب الفتريتة والدبر",
          "سعر قنطار السمسم الأبيض",
          "بورصة المحاصيل السودانية",
          "سوق محصول القضارف",
          ...cropNames,
        ],
        variableMeasured: [
          "أعلى سعر (ج.س)",
          "أدنى سعر (ج.س)",
          "متوسط السعر (ج.س)",
          "كمية الوارد (جوال)",
          "نسبة التغيّر اليومي (%)",
        ],
        creator: {
          "@type": "Organization",
          name: "بورصة المحاصيل الزراعية في السودان - القضارف",
          url: siteUrl,
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <ExchangeDashboard
        initialCrops={crops}
        latestDate={latestDate}
        isMock={isMock}
        initialCity={initialCity}
        initialCategory={initialCategory}
      />
    </>
  );
}
