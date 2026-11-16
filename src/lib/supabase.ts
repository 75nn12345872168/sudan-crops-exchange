import { createClient, SupabaseClient } from "@supabase/supabase-js";

function isValidSupabaseUrl(url: string | undefined): url is string {
  if (!url) return false;
  const trimmed = url.trim();
  return (
    (trimmed.startsWith("https://") || trimmed.startsWith("http://")) &&
    !trimmed.includes("your-project")
  );
}

export function getPublicSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isValidSupabaseUrl(url) || !anonKey || anonKey.includes("your-anon-key")) {
    return null;
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}

export function getAdminSupabaseClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !isValidSupabaseUrl(url) ||
    !serviceRoleKey ||
    serviceRoleKey.includes("your-service-role-key")
  ) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
