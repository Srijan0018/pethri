/**
 * Server-side configuration and environment guards for Pethri.com
 */

export function isDemoModeEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  const explicitDemo = process.env.DEMO_MODE?.trim().toLowerCase() === "true";
  return explicitDemo || !process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === "production";
}
