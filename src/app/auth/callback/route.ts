import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/profile";
  const nextPath =
    rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/profile";

  if (!code) {
    const errUrl = new URL("/auth", origin);
    errUrl.searchParams.set(
      "error",
      "Missing authorization code from Supabase confirmation link."
    );
    return NextResponse.redirect(errUrl);
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    const errUrl = new URL("/auth", origin);
    errUrl.searchParams.set(
      "error",
      "Supabase environment variables are not configured on the server."
    );
    return NextResponse.redirect(errUrl);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const errUrl = new URL("/auth", origin);
    errUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(errUrl);
  }

  return NextResponse.redirect(new URL(nextPath, origin));
}
