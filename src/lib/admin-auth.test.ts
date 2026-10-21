import assert from "node:assert/strict";
import test from "node:test";
import {
  createAdminSessionToken,
  isValidAdminToken,
  timingSafeEqual,
} from "./admin-auth.ts";

test("timingSafeEqual compares strings without early exit", () => {
  assert.equal(timingSafeEqual("same", "same"), true);
  assert.equal(timingSafeEqual("same", "diff"), false);
  assert.equal(timingSafeEqual("short", "longer"), false);
});

test("isValidAdminToken accepts only the configured password token", async () => {
  const previousPassword = process.env.ADMIN_PASSWORD;
  process.env.ADMIN_PASSWORD = "test-password";

  try {
    const token = await createAdminSessionToken("test-password");

    assert.equal(await isValidAdminToken(token), true);
    assert.equal(await isValidAdminToken("not-the-token"), false);
    assert.equal(await isValidAdminToken(undefined), false);
  } finally {
    if (previousPassword === undefined) {
      delete process.env.ADMIN_PASSWORD;
    } else {
      process.env.ADMIN_PASSWORD = previousPassword;
    }
  }
});

test("isValidAdminToken rejects all tokens when the password is missing", async () => {
  const previousPassword = process.env.ADMIN_PASSWORD;
  delete process.env.ADMIN_PASSWORD;

  try {
    const token = await createAdminSessionToken("anything");
    assert.equal(await isValidAdminToken(token), false);
  } finally {
    if (previousPassword !== undefined) {
      process.env.ADMIN_PASSWORD = previousPassword;
    }
  }
});
