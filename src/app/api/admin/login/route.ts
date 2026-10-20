import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE,
  createAdminSessionToken,
  getAdminPassword,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    password?: unknown;
  } | null;
  const password = typeof body?.password === "string" ? body.password : "";
  const expectedPassword = getAdminPassword();

  if (!expectedPassword) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD غير مضبوط في متغيرات البيئة." },
      { status: 500 },
    );
  }

  if (password !== expectedPassword) {
    return NextResponse.json(
      { error: "كلمة المرور غير صحيحة." },
      { status: 401 },
    );
  }

  const token = await createAdminSessionToken(expectedPassword);
  const response = NextResponse.json({ ok: true });

  response.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });

  return response;
}
