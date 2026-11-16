export interface CropPrice {
  id: string;
  crop_name: string;
  category: string | null;
  market_city: string;
  unit: string;
  min_price: number | null;
  max_price: number | null;
  avg_price: number;
  change_percent: number;
  arrivals_sacks: number;
  currency: string;
  source: string;
  recorded_date: string;
  created_at?: string;
}

export type MarketCity = "القضارف" | "بورتسودان صادر" | "الأبيض" | "تندلتي";

export const MARKET_CITIES: readonly MarketCity[] = [
  "القضارف",
  "بورتسودان صادر",
  "الأبيض",
  "تندلتي",
] as const;

export const CROP_CATEGORIES: readonly string[] = [
  "حبوب",
  "محاصيل زيتية",
  "تسالي",
] as const;

export const CROP_UNITS: readonly string[] = [
  "أردب",
  "قنطار",
  "طن",
  "جوال",
] as const;

export interface CropsFetchResult {
  crops: CropPrice[];
  latestDate: string;
  isMock: boolean;
}
