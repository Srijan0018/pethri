import assert from "node:assert/strict";
import test from "node:test";
import {
  isValidCategory,
  hasMinimumPasswordLength,
  matchesMomentFilter,
  parsePagination,
  sanitizeText,
} from "../src/lib/repositories/validation.ts";

test("accepts only configured article categories", () => {
  assert.equal(isValidCategory("news"), true);
  assert.equal(isValidCategory("unknown"), false);
});

test("caps pagination and preserves valid offsets", () => {
  assert.deepEqual(
    parsePagination(new URLSearchParams("limit=500&offset=8")),
    { limit: 50, offset: 8 }
  );
  assert.deepEqual(
    parsePagination(new URLSearchParams("limit=0&offset=-1")),
    { limit: 20, offset: 0 }
  );
});

test("sanitizes untrusted text and enforces the requested length", () => {
  assert.equal(sanitizeText("  private details  ", 7), "private");
  assert.equal(sanitizeText({ value: "not text" }), "");
});

test("moment filters include moments only when explicitly requested", () => {
  assert.equal(matchesMomentFilter(true, true), true);
  assert.equal(matchesMomentFilter(false, true), false);
  assert.equal(matchesMomentFilter(false), true);
  assert.equal(matchesMomentFilter(true), false);
});

test("requires passwords to be at least twelve characters", () => {
  assert.equal(hasMinimumPasswordLength("shortpass"), false);
  assert.equal(hasMinimumPasswordLength("twelve chars"), true);
});
