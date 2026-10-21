import assert from "node:assert/strict";
import test from "node:test";
import { readJsonBody } from "./request-body.ts";

const jsonRequest = (body: string, headers: Record<string, string> = {}) =>
  new Request("http://localhost/test", {
    method: "POST",
    body,
    headers: { "content-type": "application/json", ...headers },
  });

test("parses JSON within the limit", async () => {
  const result = await readJsonBody(jsonRequest('{"ok":true}'), 1024);

  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.value, { ok: true });
});

test("rejects invalid JSON", async () => {
  const result = await readJsonBody(jsonRequest("{"), 1024);

  assert.deepEqual(result, { ok: false, reason: "invalid" });
});

test("rejects an oversized body", async () => {
  const result = await readJsonBody(jsonRequest("x".repeat(2048)), 1024);

  assert.deepEqual(result, { ok: false, reason: "too_large" });
});

test("rejects an oversized content-length before reading", async () => {
  const result = await readJsonBody(
    jsonRequest("{}", { "content-length": "2048" }),
    1024,
  );

  assert.deepEqual(result, { ok: false, reason: "too_large" });
});
