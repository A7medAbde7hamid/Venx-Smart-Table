import type { NextRequest } from "next/server";

export const ADMIN_COOKIE_NAME = "venx_admin";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

const TOKEN_PREFIX = "venx-smart-table:admin:";

export async function createAdminSessionToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`${TOKEN_PREFIX}${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;

  let difference = 0;

  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return difference === 0;
}

export function getAdminPassword(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  return password && password.trim().length > 0 ? password : null;
}

export async function isValidAdminToken(
  token: string | undefined,
): Promise<boolean> {
  const password = getAdminPassword();
  if (!password || !token) return false;

  const expectedToken = await createAdminSessionToken(password);
  return timingSafeEqual(token, expectedToken);
}

export async function isAdminAuthenticated(
  request: NextRequest,
): Promise<boolean> {
  return isValidAdminToken(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
}
