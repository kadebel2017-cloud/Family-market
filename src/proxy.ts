import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/config";

// Optimistic guard: full verification happens server-side in the
// protected pages (see src/lib/auth/dal.ts). Proxy only redirects
// anonymous/admin-session requests away from the admin area.
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === "/admin/login";
  const isApiRoute = pathname.startsWith("/api/");

  if (isLoginPage || isApiRoute) {
    return NextResponse.next();
  }

  const hasSessionCookie = request.cookies.has(SESSION_COOKIE_NAME);

  if (!hasSessionCookie) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};