import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getServerSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim();
  return { url, key };
}

export function isServerSupabaseConfigured(): boolean {
  const { url, key } = getServerSupabaseEnv();
  return Boolean(
    url &&
      key &&
      !url.includes("your-project-ref") &&
      !key.includes("your-supabase-anon-key")
  );
}

export async function createSupabaseServerClient() {
  const { url, key } = getServerSupabaseEnv();

  if (!isServerSupabaseConfigured() || !url || !key) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component; proxy.ts handles session cookie refreshes.
        }
      },
    },
  });
}
