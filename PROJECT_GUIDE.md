# دليل المشروع — بورصة المحاصيل الزراعية في السودان - القضارف (Sudan Crops Exchange)

منصة ويب متكاملة مع خط سحب بيانات آلي (ETL) لعرض ومتابعة الأسعار اليومية وكميات الوارد للمحاصيل الزراعية السودانية (القضارف، بورتسودان صادر، الأبيض، تندلتي)، مع لوحة إدخال ميداني سريعة ومشاركة فورية لنشرات واتساب وتيليجرام.

---

## 1. المعمارية التقنية (Architecture)

1. **الواجهة الأمامية والخلفية (Next.js 14 App Router + TypeScript + Tailwind CSS):**
   - واجهة عربية بالكامل (`lang="ar"`, `dir="rtl"`).
   - جلب البيانات عبر Server Components (`src/app/page.tsx`) مع آلية احتياطية ذكية (`src/lib/mock-data.ts`) تعمل تلقائياً إذا لم تُضبط مفاتيح Supabase بعد.
   - تحديث ميداني محمي بكلمة مرور (`ADMIN_PASSWORD`) عبر Server Action آمن في `src/app/admin/update/actions.ts` باستخدام مفتاح `SUPABASE_SERVICE_ROLE_KEY`.
2. **قاعدة البيانات (Supabase PostgreSQL):**
   - جدول `public.crop_prices` مع قيد منع التكرار `(crop_name, market_city, recorded_date)` لدعم `UPSERT` اليومي بدون تكرار.
   - تفعيل Row Level Security (RLS): قراءة عامة (`SELECT`) للجميع، وكتابة/تعديل حصري عبر `service_role`.
3. **محرك السحب الآلي (`scripts/crop_sync.py`):**
   - يسحب النشرة الرسمية من `https://souq.mib-sd.com/` باستخدام `requests` و`BeautifulSoup4`.
   - ينظف الأرقام العربية/الإنجليزية ويفصل الشارات الإضافية (مثل شارة `خارج الإجمالي` بجانب محصول `تسالي`) ويحسب المتوسط `(أعلى + أدنى) ÷ 2` ويستخرج تاريخ النشرة من `window.MIB.latest`.
   - يدعم خيار `--dry-run` لطباعة JSON منسق دون الكتابة في قاعدة البيانات.
4. **الأتمتة السحابية (GitHub Actions):**
   - `.github/workflows/sync-crops.yml` يعمل تلقائياً يومياً الساعة 12:00 ظهراً و4:00 عصراً بتوقيت السودان (`10:00` و`14:00 UTC`) بالإضافة إلى التشغيل اليدوي (`workflow_dispatch`).

---

## 2. هيكل الملفات (Project Structure)

```text
sudan-crops-exchange/
├── .github/
│   └── workflows/
│       └── sync-crops.yml          # أتمتة GitHub Actions اليومية
├── scripts/
│   └── crop_sync.py                # سكريبت السحب الآلي والمزامنة مع Supabase
├── supabase/
│   └── schema.sql                  # هيكل جدول crop_prices وفهارسه وسياسات RLS
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   └── update/
│   │   │       ├── actions.ts      # Server Action محمي بـ ADMIN_PASSWORD
│   │   │       └── page.tsx        # صفحة لوحة الإدخال الميداني
│   │   ├── globals.css             # تنسيقات Tailwind الأساسية
│   │   ├── layout.tsx              # التخطيط العام RTL والخطوط العربية
│   │   └── page.tsx                # الصفحة الرئيسية (Server Component)
│   ├── components/
│   │   ├── AdminUpdateForm.tsx     # نموذج الإدخال الميداني السريع للهاتف
│   │   └── ExchangeDashboard.tsx   # الواجهة التفاعلية (البطاقات، الفلاتر، الحاسبة، النسخ)
│   └── lib/
│       ├── crops.ts                # دوال الجلب والتنسيق وتوليد نشرة واتساب
│       ├── mock-data.ts            # بيانات تجريبية ذكية مطابقة لواقع السوق
│       ├── supabase.ts             # عملاء Supabase (العام والإداري)
│       └── types.ts                # تعريفات TypeScript والثوابت
├── .env.example                    # نموذج متغيرات البيئة المطلوبة
├── PROJECT_GUIDE.md                # هذا الدليل
├── package.json
└── requirements.txt
```

---

## 3. هيكل جدول `crop_prices`

| العمود | النوع | الوصف |
| --- | --- | --- |
| `id` | `UUID` | المعرّف الفريد (`gen_random_uuid()`) |
| `crop_name` | `TEXT NOT NULL` | اسم المحصول (دبر، فتريتة، السمسم، تسالي...) |
| `category` | `TEXT` | التصنيف (حبوب، محاصيل زيتية، تسالي) |
| `market_city` | `TEXT NOT NULL` | المدينة/السوق (الافتراضي: `'القضارف'`) |
| `unit` | `TEXT NOT NULL` | وحدة التسعير (أردب، قنطار، طن، جوال) |
| `min_price` | `NUMERIC` | أدنى سعر مسجل |
| `max_price` | `NUMERIC` | أعلى سعر مسجل |
| `avg_price` | `NUMERIC NOT NULL` | متوسط السعر الحالي |
| `change_percent` | `NUMERIC` | نسبة التغيّر اليومي (%) |
| `arrivals_sacks` | `INTEGER` | كمية الوارد بالجوال |
| `currency` | `TEXT` | العملة (الافتراضي: `'SDG'`) |
| `source` | `TEXT` | مصدر البيانات (الافتراضي: `'souq.mib-sd.com'`) |
| `recorded_date` | `DATE NOT NULL` | تاريخ النشرة (`CURRENT_DATE`) |
| `created_at` | `TIMESTAMPTZ` | وقت إنشاء السجل |

- **قيد الفرادة (Unique Constraint):** `(crop_name, market_city, recorded_date)`.

---

## 4. خطوات التشغيل والربط السحابي

### أ. تجهيز قاعدة بيانات Supabase
1. أنشئ مشروعاً جديداً في Supabase.
2. افتح **SQL Editor** ونفّذ محتوى `supabase/schema.sql`.
3. انسخ المفاتيح إلى `.env.local` (للويب) و`.env` (لبايثون) استناداً إلى `.env.example`.

### ب. اختبار السحب الآلي محلياً
```bash
pip install -r requirements.txt
python scripts/crop_sync.py --dry-run
# بعد ضبط المفاتيح:
python scripts/crop_sync.py
```

### ج. تشغيل تطبيق الويب محلياً
```bash
npm install
npm run dev
```

### د. تفعيل GitHub Actions
من إعدادات المستودع في GitHub (`Settings -> Secrets and variables -> Actions`) أضف:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
