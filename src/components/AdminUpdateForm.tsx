"use client";

import React, { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Lock,
  Save,
  Sprout,
} from "lucide-react";
import {
  AdminUpdateState,
  submitCropPriceUpdate,
} from "@/app/admin/update/actions";
import { CROP_CATEGORIES, CROP_UNITS, MARKET_CITIES } from "@/lib/types";

const PRESET_CROPS: Array<{
  name: string;
  category: string;
  unit: string;
}> = [
  { name: "دبر", category: "حبوب", unit: "أردب" },
  { name: "فتريتة", category: "حبوب", unit: "أردب" },
  { name: "عكر", category: "حبوب", unit: "أردب" },
  { name: "دخن", category: "حبوب", unit: "أردب" },
  { name: "المقد", category: "حبوب", unit: "أردب" },
  { name: "ود باكو", category: "حبوب", unit: "أردب" },
  { name: "حريراي", category: "حبوب", unit: "أردب" },
  { name: "السمسم", category: "محاصيل زيتية", unit: "قنطار" },
  { name: "سمسم أبيض صادر", category: "محاصيل زيتية", unit: "طن" },
  { name: "زهرة الشمس", category: "محاصيل زيتية", unit: "قنطار" },
  { name: "فول سوداني", category: "محاصيل زيتية", unit: "قنطار" },
  { name: "كركدي", category: "محاصيل زيتية", unit: "قنطار" },
  { name: "تسالي", category: "تسالي", unit: "طن" },
];

const INITIAL_STATE: AdminUpdateState = {
  status: "idle",
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Save className="h-5 w-5" />
      <span>{pending ? "جاري الحفظ والتحديث..." : "حفظ وتحديث السعر فوراً"}</span>
    </button>
  );
}

export default function AdminUpdateForm({
  defaultDate,
}: {
  defaultDate: string;
}) {
  const [state, formAction] = useFormState(submitCropPriceUpdate, INITIAL_STATE);
  const [cropPreset, setCropPreset] = useState<string>(PRESET_CROPS[0].name);
  const [category, setCategory] = useState<string>(PRESET_CROPS[0].category);
  const [unit, setUnit] = useState<string>(PRESET_CROPS[0].unit);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  function handlePresetChange(value: string) {
    setCropPreset(value);
    const match = PRESET_CROPS.find((c) => c.name === value);
    if (match) {
      setCategory(match.category);
      setUnit(match.unit);
    }
  }

  const parsedMin = Number.parseFloat(minPrice);
  const parsedMax = Number.parseFloat(maxPrice);
  const computedAvg =
    Number.isFinite(parsedMin) && Number.isFinite(parsedMax)
      ? Math.round((parsedMin + parsedMax) / 2)
      : Number.isFinite(parsedMax)
        ? parsedMax
        : Number.isFinite(parsedMin)
          ? parsedMin
          : null;

  return (
    <div className="min-h-screen bg-[#f4f6f3] px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-emerald-900 shadow-sm ring-1 ring-slate-200 transition hover:bg-emerald-50"
          >
            <ArrowRight className="h-4 w-4" />
            <span>العودة للبورصة</span>
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Sprout className="h-4 w-4 text-emerald-700" />
            إدخال ميداني سريع
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="border-b border-slate-100 pb-4">
            <h1 className="text-xl font-bold text-slate-900">
              لوحة الإدخال الميداني السريعة
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              تحديث فوري لأسعار المحاصيل والوارد في قاعدة البيانات السحابية
            </p>
          </div>

          {state.status !== "idle" && (
            <div
              role="alert"
              className={`mt-4 flex items-start gap-2.5 rounded-xl p-3.5 text-sm font-medium ${
                state.status === "success"
                  ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200"
                  : "bg-rose-50 text-rose-900 ring-1 ring-rose-200"
              }`}
            >
              {state.status === "success" ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              )}
              <span>{state.message}</span>
            </div>
          )}

          <form action={formAction} className="mt-5 space-y-4">
            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700"
              >
                <Lock className="h-3.5 w-3.5 text-amber-600" />
                <span>كلمة مرور المشرف (ADMIN_PASSWORD)</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="أدخل كلمة مرور المشرف"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>

            {/* City & Date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="market_city"
                  className="mb-1.5 block text-xs font-bold text-slate-700"
                >
                  السوق / المدينة
                </label>
                <select
                  id="market_city"
                  name="market_city"
                  defaultValue="القضارف"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                >
                  {MARKET_CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="recorded_date"
                  className="mb-1.5 block text-xs font-bold text-slate-700"
                >
                  تاريخ النشرة
                </label>
                <input
                  id="recorded_date"
                  name="recorded_date"
                  type="date"
                  defaultValue={defaultDate}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm tabular-nums text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Crop Selection */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label
                  htmlFor="crop_preset"
                  className="mb-1.5 block text-xs font-bold text-slate-700"
                >
                  المحصول
                </label>
                <select
                  id="crop_preset"
                  name="crop_preset"
                  value={cropPreset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                >
                  {PRESET_CROPS.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  <option value="__custom__">محصول آخر (إدخال يدوي)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="mb-1.5 block text-xs font-bold text-slate-700"
                >
                  التصنيف
                </label>
                <select
                  id="category"
                  name="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                >
                  {CROP_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="unit"
                  className="mb-1.5 block text-xs font-bold text-slate-700"
                >
                  وحدة القياس
                </label>
                <select
                  id="unit"
                  name="unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                >
                  {CROP_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {cropPreset === "__custom__" && (
              <div>
                <label
                  htmlFor="crop_custom"
                  className="mb-1.5 block text-xs font-bold text-slate-700"
                >
                  اسم المحصول المخصص
                </label>
                <input
                  id="crop_custom"
                  name="crop_custom"
                  type="text"
                  required
                  placeholder="مثال: صمغ عربي هشاب"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
              </div>
            )}

            {/* Prices */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="max_price"
                  className="mb-1.5 block text-xs font-bold text-slate-700"
                >
                  أعلى سعر (ج.س)
                </label>
                <input
                  id="max_price"
                  name="max_price"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="any"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="1900000"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm tabular-nums text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="min_price"
                  className="mb-1.5 block text-xs font-bold text-slate-700"
                >
                  أدنى سعر (ج.س)
                </label>
                <input
                  id="min_price"
                  name="min_price"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="any"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="1850000"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm tabular-nums text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="avg_price"
                  className="mb-1.5 block text-xs font-bold text-slate-700"
                >
                  السعر المتوسط (ج.س)
                </label>
                <input
                  id="avg_price"
                  name="avg_price"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="any"
                  placeholder={
                    computedAvg !== null
                      ? `تلقائي: ${computedAvg.toLocaleString("en-US")}`
                      : "أو أدخل مباشرة"
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm tabular-nums text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Change & Arrivals */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="arrivals_sacks"
                  className="mb-1.5 block text-xs font-bold text-slate-700"
                >
                  كمية الوارد (بالجوال)
                </label>
                <input
                  id="arrivals_sacks"
                  name="arrivals_sacks"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  defaultValue="0"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm tabular-nums text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="change_percent"
                  className="mb-1.5 block text-xs font-bold text-slate-700"
                >
                  نسبة التغيّر اليومي (%)
                </label>
                <input
                  id="change_percent"
                  name="change_percent"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  defaultValue="0"
                  placeholder="مثال: 5.5 أو -3.2"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm tabular-nums text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <SubmitButton />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
