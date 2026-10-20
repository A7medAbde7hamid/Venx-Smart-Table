import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  getAdminPassword,
} from "@/lib/admin-auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/admin/login";
  const isLoginApi = pathname === "/api/admin/login";

  if (isLoginApi) {
    return NextResponse.next();
  }

  const password = getAdminPassword();
  const expectedToken = password
    ? await createAdminSessionToken(password)
    : null;
  const currentToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const authenticated = Boolean(
    expectedToken && currentToken === expectedToken,
  );

  if (pathname.startsWith("/api/admin")) {
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (isLoginPage) {
    if (authenticated) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (!authenticated) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
