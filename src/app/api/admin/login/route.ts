import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE,
  createAdminSessionToken,
  getAdminPassword,
  timingSafeEqual,
} from "@/lib/admin-auth";
import {
  getLoginRateLimitKey,
  loginRateLimiter,
} from "@/lib/login-rate-limit";
import { readJsonBody } from "@/lib/request-body";

export const runtime = "nodejs";

const MAX_LOGIN_BODY_BYTES = 4 * 1024;

export async function POST(request: Request) {
  const rateLimitKey = getLoginRateLimitKey(request);
  const rateLimit = loginRateLimiter.check(rateLimitKey);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "محاولات دخول كتير. حاول تاني بعد شوية." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  const body = await readJsonBody(request, MAX_LOGIN_BODY_BYTES);

  if (!body.ok) {
    return NextResponse.json(
      {
        error:
          body.reason === "too_large"
            ? "الطلب كبير جدًا."
            : "بيانات الدخول غير صالحة.",
      },
      { status: body.reason === "too_large" ? 413 : 400 },
    );
  }

  const input = body.value as { password?: unknown } | null;
  const password = typeof input?.password === "string" ? input.password : "";
  const expectedPassword = getAdminPassword();

  if (!expectedPassword) {
    return NextResponse.json(
      { error: "تعذر تسجيل الدخول." },
      { status: 503 },
    );
  }

  const [actualToken, expectedToken] = await Promise.all([
    createAdminSessionToken(password),
    createAdminSessionToken(expectedPassword),
  ]);

  if (!timingSafeEqual(actualToken, expectedToken)) {
    return NextResponse.json(
      { error: "كلمة المرور غير صحيحة." },
      { status: 401 },
    );
  }

  loginRateLimiter.clear(rateLimitKey);

  const response = NextResponse.json({ ok: true });

  response.cookies.set(ADMIN_COOKIE_NAME, expectedToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });

  return response;
}
