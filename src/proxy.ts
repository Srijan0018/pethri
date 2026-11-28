import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isDemoModeEnabled } from "@/lib/server-config";

const DEMO_COOKIE_NAME = "pethri_demo_uid";

function isPrivateRoute(request: NextRequest): boolean {
  const { pathname, searchParams } = request.nextUrl;
  if (pathname === "/report" || pathname.startsWith("/report/")) {
    return true;
  }
  if (pathname === "/studio" || pathname.startsWith("/studio/")) {
    return true;
  }
  // Viewing another reporter's public profile (/profile?user=...) is open;
  // viewing own private profile/bookmarks/notifications (/profile) requires auth.
  if (pathname === "/profile" && !searchParams.get("user")) {
    return true;
  }
  return false;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim();

  const hasValidEnv = Boolean(
    url &&
      key &&
      !url.includes("your-project-ref") &&
      !key.includes("your-supabase-anon-key")
  );

  let isSupabaseUser = false;

  if (hasValidEnv && url && key) {
    try {
      const supabase = createServerClient(url, key, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();
      isSupabaseUser = Boolean(user);
    } catch {
      // Fail closed on private routes below if Supabase is unreachable
      isSupabaseUser = false;
    }
  }

  const hasDemoSession =
    isDemoModeEnabled() && Boolean(request.cookies.get(DEMO_COOKIE_NAME)?.value);

  if (isPrivateRoute(request) && !isSupabaseUser && !hasDemoSession) {
    const loginUrl = new URL("/auth", request.url);
    const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
