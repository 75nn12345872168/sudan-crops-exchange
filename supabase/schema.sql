-- ============================================================================
-- Sudan Crops Exchange (بورصة المحاصيل الزراعية في السودان - القضارف)
-- Supabase / PostgreSQL Schema
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.crop_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name TEXT NOT NULL,
  category TEXT,
  market_city TEXT NOT NULL DEFAULT 'القضارف',
  unit TEXT NOT NULL,
  min_price NUMERIC,
  max_price NUMERIC,
  avg_price NUMERIC NOT NULL,
  change_percent NUMERIC DEFAULT 0,
  arrivals_sacks INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'SDG',
  source TEXT DEFAULT 'souq.mib-sd.com',
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT crop_prices_unique_daily UNIQUE (crop_name, market_city, recorded_date)
);

-- Indexes for fast dashboard filtering and date ordering
CREATE INDEX IF NOT EXISTS idx_crop_prices_recorded_date
  ON public.crop_prices (recorded_date DESC);

CREATE INDEX IF NOT EXISTS idx_crop_prices_city_date
  ON public.crop_prices (market_city, recorded_date DESC);

CREATE INDEX IF NOT EXISTS idx_crop_prices_category
  ON public.crop_prices (category);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================
ALTER TABLE public.crop_prices ENABLE ROW LEVEL SECURITY;

-- Public read-only access (SELECT for anon and authenticated users)
DROP POLICY IF EXISTS "Allow public read access on crop_prices" ON public.crop_prices;
CREATE POLICY "Allow public read access on crop_prices"
  ON public.crop_prices
  FOR SELECT
  TO public
  USING (true);

-- Write/update/delete restricted exclusively to service_role
DROP POLICY IF EXISTS "Allow service_role full access on crop_prices" ON public.crop_prices;
CREATE POLICY "Allow service_role full access on crop_prices"
  ON public.crop_prices
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
