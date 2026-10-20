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

export function getAdminPassword(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  return password && password.trim().length > 0 ? password : null;
}
