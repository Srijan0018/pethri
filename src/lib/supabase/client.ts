import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim();
  return { url, key };
}

export function getSupabaseConfigError(): string | null {
  const { url, key } = getSupabaseEnv();
  if (!url || !key) {
    return "Supabase configuration missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.";
  }
  if (
    url.includes("your-project-ref") ||
    key.includes("your-supabase-anon-key")
  ) {
    return "Supabase placeholder credentials detected in environment variables.";
  }
  try {
    new URL(url);
  } catch {
    return "Supabase Project URL in NEXT_PUBLIC_SUPABASE_URL is invalid.";
  }
  return null;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfigError() === null;
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  const configError = getSupabaseConfigError();
  if (configError) {
    return null;
  }

  if (!browserClient) {
    const { url, key } = getSupabaseEnv();
    browserClient = createBrowserClient(url!, key!);
  }

  return browserClient;
}

/**
 * Backward-compatible alias that reuses the singleton browser client.
 */
export function createSupabaseBrowserClient(): SupabaseClient | null {
  return getSupabaseBrowserClient();
}
