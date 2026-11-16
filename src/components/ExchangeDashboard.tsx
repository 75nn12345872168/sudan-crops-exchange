"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  Check,
  Copy,
  Database,
  MapPin,
  Minus,
  Package,
  RefreshCw,
  Search,
  Share2,
  ShieldCheck,
  Sprout,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  buildBulletinShareText,
  formatArabicDate,
  formatSdgPrice,
} from "@/lib/crops";
import { CROP_CATEGORIES, CropPrice, MARKET_CITIES } from "@/lib/types";

interface ExchangeDashboardProps {
  initialCrops: CropPrice[];
  latestDate: string;
  isMock: boolean;
}

export default function ExchangeDashboard({
  initialCrops,
  latestDate,
  isMock,
}: ExchangeDashboardProps) {
  const [selectedCity, setSelectedCity] = useState<string>("الكل");
  const [selectedCategory, setSelectedCategory] = useState<string>("الكل");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [showSharePreview, setShowSharePreview] = useState<boolean>(false);

  // Calculator state
  const tradableCrops = useMemo(
    () => initialCrops.filter((c) => c.avg_price > 0),
    [initialCrops]
  );
  const [calcCropId, setCalcCropId] = useState<string>(
    tradableCrops[0]?.id ?? ""
  );
  const [calcQty, setCalcQty] = useState<string>("10");

  const filteredCrops = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return initialCrops.filter((item) => {
      if (selectedCity !== "الكل" && item.market_city !== selectedCity) {
        return false;
      }
      if (
        selectedCategory !== "الكل" &&
        (item.category || "حبوب") !== selectedCategory
      ) {
        return false;
      }
      if (q) {
        const hay = `${item.crop_name} ${item.market_city} ${item.category ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [initialCrops, selectedCity, selectedCategory, searchQuery]);

  const stats = useMemo(() => {
    let totalArrivals = 0;
    let rising = 0;
    let falling = 0;
    for (const crop of filteredCrops) {
      totalArrivals += crop.arrivals_sacks || 0;
      if (crop.change_percent > 0) rising += 1;
      else if (crop.change_percent < 0) falling += 1;
    }
    return {
      totalArrivals,
      rising,
      falling,
      count: filteredCrops.length,
    };
  }, [filteredCrops]);

  const shareText = useMemo(
    () => buildBulletinShareText(filteredCrops, selectedCity, latestDate),
    [filteredCrops, selectedCity, latestDate]
  );

  const selectedCalcCrop = useMemo(
    () =>
      tradableCrops.find((c) => c.id === calcCropId) ??
      tradableCrops[0] ??
      null,
    [tradableCrops, calcCropId]
  );

  const calcNumericQty = Math.max(0, Number.parseFloat(calcQty) || 0);

  async function handleCopyBulletin() {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);
      } else {
        const ta = document.createElement("textarea");
        ta.value = shareText;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setShowSharePreview(true);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f6f3] text-slate-900">
      {/* Top Bar / Header */}
      <header className="border-b border-emerald-900/15 bg-gradient-to-l from-emerald-950 via-emerald-900 to-emerald-800 text-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-300 ring-1 ring-amber-300/30">
                <Sprout className="h-7 w-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                    بورصة المحاصيل الزراعية في السودان - القضارف
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      isMock
                        ? "bg-amber-400/20 text-amber-200 ring-1 ring-amber-300/30"
                        : "bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-300/30"
                    }`}
                  >
                    <Database className="h-3.5 w-3.5" />
                    {isMock
                      ? "بيانات تجريبية ذكية (Fallback)"
                      : "متصل بقاعدة بيانات Supabase"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-emerald-100/90">
                  المرجع اليومي لأسعار الذرة والسمسم والمحاصيل النقدية وحركة الوارد
                  بالجوال
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-xl bg-white/10 px-3.5 py-2 text-xs backdrop-blur-sm">
                <span className="block text-emerald-200">آخر تحديث للنشرة</span>
                <span className="font-semibold text-white">
                  {formatArabicDate(latestDate)} ({latestDate})
                </span>
              </div>

              <Link
                href="/admin/update"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-amber-400"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>لوحة الإدخال الميداني</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* KPI Strip */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>إجمالي الوارد المعروض</span>
              <Package className="h-4 w-4 text-emerald-700" />
            </div>
            <div className="mt-2 text-2xl font-bold tabular-nums text-slate-900">
              {stats.totalArrivals.toLocaleString("en-US")}
            </div>
            <div className="mt-0.5 text-xs text-slate-500">جوال</div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>محاصيل مرتفعة</span>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-bold tabular-nums text-emerald-700">
              {stats.rising}
            </div>
            <div className="mt-0.5 text-xs text-emerald-600">
              صعود عن النشرة السابقة
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>محاصيل منخفضة</span>
              <TrendingDown className="h-4 w-4 text-rose-600" />
            </div>
            <div className="mt-2 text-2xl font-bold tabular-nums text-rose-600">
              {stats.falling}
            </div>
            <div className="mt-0.5 text-xs text-rose-500">
              تراجع عن النشرة السابقة
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>الأصناف المعروضة</span>
              <RefreshCw className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-bold tabular-nums text-slate-900">
              {stats.count}
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              {selectedCity === "الكل" ? "في جميع الأسواق" : `سوق ${selectedCity}`}
            </div>
          </div>
        </section>

        {/* Controls: City Filter, Category Filter, Search & Share Action */}
        <section className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* City Filter Pills */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-slate-500">
                تصفية حسب السوق / المدينة
              </span>
              <div className="flex flex-wrap gap-2">
                {["الكل", ...MARKET_CITIES].map((city) => {
                  const active = selectedCity === city;
                  return (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setSelectedCity(city)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                        active
                          ? "bg-emerald-800 text-white shadow-sm"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{city}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Share CTA */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopyBulletin}
                disabled={filteredCrops.length === 0}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition disabled:opacity-50 ${
                  copied
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-900 text-white hover:bg-emerald-800"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>تم نسخ النشرة بنجاح ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>نسخ نشرة اليوم لواتساب وتيليجرام</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowSharePreview((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <Share2 className="h-4 w-4" />
                <span>{showSharePreview ? "إخفاء المعاينة" : "معاينة النص"}</span>
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="ml-1 text-xs font-semibold text-slate-500">
                التصنيف:
              </span>
              {["الكل", ...CROP_CATEGORIES].map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "bg-amber-500 text-slate-950"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن محصول (دبر، سمسم...)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-3 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {showSharePreview && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">
                  معاينة رسالة واتساب وتيليجرام
                </span>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-emerald-700 underline hover:text-emerald-900"
                >
                  إرسال مباشر عبر واتساب ↗
                </a>
              </div>
              <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-lg bg-white p-3 font-sans text-xs leading-relaxed text-slate-800 ring-1 ring-emerald-900/10">
                {shareText}
              </pre>
            </div>
          )}
        </section>

        {/* Crop Cards Grid */}
        <section className="mt-6">
          {filteredCrops.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-base font-semibold text-slate-700">
                لا توجد أصناف مطابقة لخيارات البحث الحالية
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCity("الكل");
                  setSelectedCategory("الكل");
                  setSearchQuery("");
                }}
                className="mt-3 rounded-xl bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                إعادة ضبط الفلاتر
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCrops.map((crop) => {
                const isUp = crop.change_percent > 0;
                const isDown = crop.change_percent < 0;
                const notTraded =
                  crop.avg_price === 0 &&
                  crop.min_price === null &&
                  crop.max_price === null;

                return (
                  <article
                    key={crop.id || `${crop.market_city}-${crop.crop_name}`}
                    className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
                  >
                    {/* Card Header */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                              {crop.market_city}
                            </span>
                            {crop.category && (
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                {crop.category}
                              </span>
                            )}
                          </div>
                          <h2 className="mt-2 text-lg font-bold text-slate-900">
                            {crop.crop_name}
                          </h2>
                        </div>

                        {/* Daily Change Badge */}
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${
                            isUp
                              ? "bg-emerald-100 text-emerald-800"
                              : isDown
                                ? "bg-rose-100 text-rose-700"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isUp ? (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          ) : isDown ? (
                            <ArrowDownRight className="h-3.5 w-3.5" />
                          ) : (
                            <Minus className="h-3.5 w-3.5" />
                          )}
                          <span>
                            {isUp
                              ? `+${crop.change_percent}%`
                              : `${crop.change_percent}%`}
                          </span>
                        </span>
                      </div>

                      {/* Main Price */}
                      <div className="mt-4 rounded-xl bg-slate-50 p-3.5 ring-1 ring-slate-100">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>متوسط السعر الحالي</span>
                          <span className="font-semibold text-slate-700">
                            الوحدة: {crop.unit}
                          </span>
                        </div>
                        {notTraded ? (
                          <div className="mt-1.5 text-lg font-bold text-slate-400">
                            غير متداول اليوم
                          </div>
                        ) : (
                          <div className="mt-1 flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold tabular-nums text-emerald-950">
                              {formatSdgPrice(crop.avg_price)}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">
                              ج.س
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* High / Low & Arrivals */}
                    <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3.5 text-center">
                      <div>
                        <span className="block text-[11px] text-slate-500">
                          أعلى سعر
                        </span>
                        <span className="mt-0.5 block text-xs font-bold tabular-nums text-slate-800">
                          {formatSdgPrice(crop.max_price)}
                        </span>
                      </div>
                      <div className="border-x border-slate-100">
                        <span className="block text-[11px] text-slate-500">
                          أدنى سعر
                        </span>
                        <span className="mt-0.5 block text-xs font-bold tabular-nums text-slate-800">
                          {formatSdgPrice(crop.min_price)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-slate-500">
                          الوارد
                        </span>
                        <span className="mt-0.5 block text-xs font-bold tabular-nums text-amber-700">
                          {crop.arrivals_sacks.toLocaleString("en-US")} جوال
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Quick Value Calculator */}
        {selectedCalcCrop && (
          <section className="mt-8 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-emerald-800" />
              <h2 className="text-base font-bold text-slate-900">
                حاسبة قيمة المحصول الفورية
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              احسب القيمة التقديرية لكميتك بناءً على أسعار نشرة اليوم
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  اختر الصنف والسوق
                </label>
                <select
                  value={selectedCalcCrop.id}
                  onChange={(e) => setCalcCropId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                >
                  {tradableCrops.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.crop_name} — {c.market_city} ({c.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  الكمية ({selectedCalcCrop.unit})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={calcQty}
                  onChange={(e) => setCalcQty(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm tabular-nums text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex flex-col justify-center rounded-xl bg-emerald-50 px-4 py-2.5 ring-1 ring-emerald-200">
                <span className="text-xs font-medium text-emerald-800">
                  القيمة التقديرية بالمتوسط
                </span>
                <span className="mt-0.5 text-xl font-bold tabular-nums text-emerald-950">
                  {calcNumericQty > 0
                    ? `${formatSdgPrice(selectedCalcCrop.avg_price * calcNumericQty)} ج.س`
                    : "—"}
                </span>
              </div>
            </div>
          </section>
        )}

        <footer className="mt-10 border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          بورصة المحاصيل الزراعية في السودان - القضارف · البيانات المرجعية من{" "}
          <span className="font-mono">souq.mib-sd.com</span> والتحديثات الميدانية
        </footer>
      </main>
    </div>
  );
}
