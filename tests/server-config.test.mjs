import assert from "node:assert/strict";
import test from "node:test";
import { isDemoModeEnabled } from "../src/lib/server-config.ts";

function withEnvironment(values, run) {
  const previous = Object.fromEntries(
    Object.keys(values).map((key) => [key, process.env[key]])
  );
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  try {
    run();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("never enables demo mode in production", () => {
  withEnvironment(
    {
      NODE_ENV: "production",
      DEMO_MODE: "true",
      NEXT_PUBLIC_SUPABASE_URL: undefined,
    },
    () => assert.equal(isDemoModeEnabled(), false)
  );
});

test("allows an explicit demo mode only outside production", () => {
  withEnvironment(
    {
      NODE_ENV: "development",
      DEMO_MODE: "true",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    },
    () => assert.equal(isDemoModeEnabled(), true)
  );
});
