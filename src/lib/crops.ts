import { FALLBACK_MOCK_CROPS } from "./mock-data";
import { getPublicSupabaseClient } from "./supabase";
import { CropPrice, CropsFetchResult } from "./types";

function normalizeCropRow(row: Record<string, unknown>): CropPrice {
  return {
    id: String(row.id ?? ""),
    crop_name: String(row.crop_name ?? ""),
    category: row.category ? String(row.category) : null,
    market_city: String(row.market_city ?? "القضارف"),
    unit: String(row.unit ?? "أردب"),
    min_price: row.min_price !== null && row.min_price !== undefined ? Number(row.min_price) : null,
    max_price: row.max_price !== null && row.max_price !== undefined ? Number(row.max_price) : null,
    avg_price: Number(row.avg_price ?? 0),
    change_percent: Number(row.change_percent ?? 0),
    arrivals_sacks: Number(row.arrivals_sacks ?? 0),
    currency: String(row.currency ?? "SDG"),
    source: String(row.source ?? "souq.mib-sd.com"),
    recorded_date: String(row.recorded_date ?? ""),
    created_at: row.created_at ? String(row.created_at) : undefined,
  };
}

export async function fetchLatestCropPrices(): Promise<CropsFetchResult> {
  const client = getPublicSupabaseClient();

  if (!client) {
    return {
      crops: FALLBACK_MOCK_CROPS,
      latestDate: FALLBACK_MOCK_CROPS[0]?.recorded_date ?? "2026-11-15",
      isMock: true,
    };
  }

  try {
    const { data, error } = await client
      .from("crop_prices")
      .select("*")
      .order("recorded_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200);

    if (error || !data || data.length === 0) {
      return {
        crops: FALLBACK_MOCK_CROPS,
        latestDate: FALLBACK_MOCK_CROPS[0]?.recorded_date ?? "2026-11-15",
        isMock: true,
      };
    }

    // Keep the most recent bulletin per (crop_name, market_city)
    const latestByPair = new Map<string, CropPrice>();
    let newestDate = "";

    for (const raw of data) {
      const normalized = normalizeCropRow(raw as Record<string, unknown>);
      if (!newestDate || normalized.recorded_date > newestDate) {
        newestDate = normalized.recorded_date;
      }
      const key = `${normalized.market_city}::${normalized.crop_name}`;
      if (!latestByPair.has(key)) {
        latestByPair.set(key, normalized);
      }
    }

    const crops = Array.from(latestByPair.values());
    return {
      crops,
      latestDate: newestDate || FALLBACK_MOCK_CROPS[0].recorded_date,
      isMock: false,
    };
  } catch {
    return {
      crops: FALLBACK_MOCK_CROPS,
      latestDate: FALLBACK_MOCK_CROPS[0]?.recorded_date ?? "2026-11-15",
      isMock: true,
    };
  }
}

export function formatSdgPrice(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value) || value === 0) {
    return "—";
  }
  return Math.round(value).toLocaleString("en-US");
}

export function formatArabicDate(isoDate: string): string {
  if (!isoDate) return "";
  const parsed = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return new Intl.DateTimeFormat("ar-SD", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

export function buildBulletinShareText(
  crops: CropPrice[],
  cityFilter: string,
  dateStr: string
): string {
  const titleCity = cityFilter === "الكل" ? "أسواق السودان (القضارف والولايات)" : `بورصة ${cityFilter}`;
  const arabicDate = formatArabicDate(dateStr) || dateStr;

  const lines: string[] = [
    `🌾 *بورصة المحاصيل الزراعية — ${titleCity}*`,
    `📅 ${arabicDate}`,
    "",
  ];

  // Group by category
  const groups = new Map<string, CropPrice[]>();
  for (const c of crops) {
    const cat = c.category || "أخرى";
    const list = groups.get(cat) ?? [];
    list.push(c);
    groups.set(cat, list);
  }

  let totalArrivals = 0;

  for (const [category, items] of Array.from(groups.entries())) {
    const emoji = category === "محاصيل زيتية" ? "🌻" : category === "تسالي" ? "🍉" : "🌾";
    lines.push(`${emoji} *${category}:*`);
    for (const item of items) {
      totalArrivals += item.arrivals_sacks || 0;
      const hasRange = item.max_price !== null && item.min_price !== null;
      const priceText = hasRange
        ? `${formatSdgPrice(item.max_price)} / ${formatSdgPrice(item.min_price)} ج.س`
        : item.avg_price > 0
          ? `${formatSdgPrice(item.avg_price)} ج.س`
          : "غير متداول";
      const trend =
        item.change_percent > 0
          ? `🟢 +${item.change_percent}%`
          : item.change_percent < 0
            ? `🔴 ${item.change_percent}%`
            : "⚪ 0%";
      const arrivals = item.arrivals_sacks > 0 ? ` | الوارد: ${item.arrivals_sacks.toLocaleString("en-US")} جوال` : "";
      const cityTag = cityFilter === "الكل" ? ` [${item.market_city}]` : "";
      lines.push(`• ${item.crop_name}${cityTag} (${item.unit}): ${priceText} (${trend})${arrivals}`);
    }
    lines.push("");
  }

  lines.push(`📦 *إجمالي الوارد المعروض:* ${totalArrivals.toLocaleString("en-US")} جوال`);
  lines.push("🔗 المصدر: منصة بورصة المحاصيل الزراعية في السودان");
  return lines.join("\n");
}
