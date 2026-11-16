"use server";

import { timingSafeEqual } from "crypto";
import { revalidatePath } from "next/cache";
import { getAdminSupabaseClient } from "@/lib/supabase";

export interface AdminUpdateState {
  status: "idle" | "success" | "error";
  message: string;
}

function verifyAdminPassword(provided: string, expected: string): boolean {
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function parseOptionalNumber(raw: FormDataEntryValue | null): number | null {
  if (raw === null) return null;
  const trimmed = String(raw).trim().replace(/,/g, "");
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

export async function submitCropPriceUpdate(
  _prevState: AdminUpdateState,
  formData: FormData
): Promise<AdminUpdateState> {
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) {
    return {
      status: "error",
      message:
        "متغير البيئة ADMIN_PASSWORD غير مضبوط على الخادم. يرجى إضافته في ملف .env.local أو إعدادات الاستضافة.",
    };
  }

  const password = String(formData.get("password") ?? "");
  if (!password || !verifyAdminPassword(password, expectedPassword)) {
    return {
      status: "error",
      message: "كلمة مرور المشرف غير صحيحة.",
    };
  }

  const marketCity = String(formData.get("market_city") ?? "").trim();
  const presetCrop = String(formData.get("crop_preset") ?? "").trim();
  const customCrop = String(formData.get("crop_custom") ?? "").trim();
  const cropName = presetCrop === "__custom__" ? customCrop : presetCrop;
  const category = String(formData.get("category") ?? "حبوب").trim();
  const unit = String(formData.get("unit") ?? "أردب").trim();
  const recordedDate =
    String(formData.get("recorded_date") ?? "").trim() ||
    new Date().toISOString().slice(0, 10);

  if (!marketCity || !cropName || !unit) {
    return {
      status: "error",
      message: "يرجى تعبئة المدينة واسم المحصول ووحدة القياس.",
    };
  }

  const minPrice = parseOptionalNumber(formData.get("min_price"));
  const maxPrice = parseOptionalNumber(formData.get("max_price"));
  const explicitAvg = parseOptionalNumber(formData.get("avg_price"));
  const changePercent = parseOptionalNumber(formData.get("change_percent")) ?? 0;
  const arrivalsSacks = Math.max(
    0,
    Math.round(parseOptionalNumber(formData.get("arrivals_sacks")) ?? 0)
  );

  let avgPrice = explicitAvg;
  if (avgPrice === null) {
    if (minPrice !== null && maxPrice !== null) {
      avgPrice = Math.round((minPrice + maxPrice) / 2);
    } else if (maxPrice !== null) {
      avgPrice = maxPrice;
    } else if (minPrice !== null) {
      avgPrice = minPrice;
    }
  }

  if (avgPrice === null || avgPrice < 0) {
    return {
      status: "error",
      message: "يرجى إدخال السعر المتوسط أو حدي السعر (الأعلى والأدنى) بشكل صحيح.",
    };
  }

  const adminClient = getAdminSupabaseClient();
  if (!adminClient) {
    return {
      status: "error",
      message:
        "بيانات الاتصال بقاعدة بيانات Supabase غير مكتملة (SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL). أضف المفاتيح أولاً لتفعيل الحفظ السحابي.",
    };
  }

  const record = {
    crop_name: cropName,
    category,
    market_city: marketCity,
    unit,
    min_price: minPrice,
    max_price: maxPrice,
    avg_price: avgPrice,
    change_percent: changePercent,
    arrivals_sacks: arrivalsSacks,
    currency: "SDG",
    source: "إدخال ميداني مباشر",
    recorded_date: recordedDate,
  };

  const { error } = await adminClient
    .from("crop_prices")
    .upsert([record], { onConflict: "crop_name,market_city,recorded_date" });

  if (error) {
    return {
      status: "error",
      message: `تعذر حفظ البيانات في Supabase: ${error.message}`,
    };
  }

  revalidatePath("/");
  return {
    status: "success",
    message: `تم حفظ/تحديث سعر «${cropName}» في سوق «${marketCity}» لتاريخ ${recordedDate} بنجاح.`,
  };
}
