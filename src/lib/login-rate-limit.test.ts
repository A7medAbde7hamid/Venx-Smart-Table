import assert from "node:assert/strict";
import test from "node:test";
import {
  LoginRateLimiter,
  getLoginRateLimitKey,
} from "./login-rate-limit.ts";

test("allows attempts up to the limit then blocks", () => {
  const limiter = new LoginRateLimiter(2, 1000);
  const now = 1_000_000;

  assert.deepEqual(limiter.check("client", now), {
    allowed: true,
    retryAfterSeconds: 0,
  });
  assert.deepEqual(limiter.check("client", now), {
    allowed: true,
    retryAfterSeconds: 0,
  });

  const blocked = limiter.check("client", now);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSeconds, 1);
});

test("allows again after the window expires", () => {
  const limiter = new LoginRateLimiter(1, 1000);
  const now = 1_000_000;

  assert.equal(limiter.check("client", now).allowed, true);
  assert.equal(limiter.check("client", now).allowed, false);
  assert.equal(limiter.check("client", now + 1000).allowed, true);
});

test("clear resets a client bucket", () => {
  const limiter = new LoginRateLimiter(1, 1000);
  const now = 1_000_000;

  assert.equal(limiter.check("client", now).allowed, true);
  assert.equal(limiter.check("client", now).allowed, false);

  limiter.clear("client");

  assert.equal(limiter.check("client", now).allowed, true);
});

test("keeps separate buckets per client", () => {
  const limiter = new LoginRateLimiter(1, 1000);
  const now = 1_000_000;

  assert.equal(limiter.check("first", now).allowed, true);
  assert.equal(limiter.check("first", now).allowed, false);
  assert.equal(limiter.check("second", now).allowed, true);
});

test("extracts the client key from proxy headers", () => {
  assert.equal(
    getLoginRateLimitKey(
      new Request("http://localhost", {
        headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
      }),
    ),
    "1.2.3.4",
  );

  assert.equal(
    getLoginRateLimitKey(
      new Request("http://localhost", {
        headers: { "x-real-ip": "9.8.7.6" },
      }),
    ),
    "9.8.7.6",
  );

  assert.equal(
    getLoginRateLimitKey(new Request("http://localhost")),
    "unknown",
  );
});
