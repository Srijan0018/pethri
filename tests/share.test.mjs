import assert from "node:assert/strict";
import test from "node:test";
import { shareContent } from "../src/lib/share.ts";

function withNavigator(value, run) {
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value,
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {},
  });

  return Promise.resolve()
    .then(run)
    .finally(() => {
      if (originalNavigator) {
        Object.defineProperty(globalThis, "navigator", originalNavigator);
      } else {
        delete globalThis.navigator;
      }
      if (originalWindow) {
        Object.defineProperty(globalThis, "window", originalWindow);
      } else {
        delete globalThis.window;
      }
    });
}

test("uses the Web Share API when available", async () => {
  let shared;
  const content = { title: "Local update", url: "https://pethri.com/article/1" };

  const result = await withNavigator(
    { share: async (value) => { shared = value; } },
    () => shareContent(content)
  );

  assert.equal(result, "shared");
  assert.deepEqual(shared, content);
});

test("copies the URL when the Web Share API is unavailable", async () => {
  let copied;
  const result = await withNavigator(
    { clipboard: { writeText: async (value) => { copied = value; } } },
    () => shareContent({ title: "Local update", url: "https://pethri.com/article/2" })
  );

  assert.equal(result, "copied");
  assert.equal(copied, "https://pethri.com/article/2");
});

test("does not copy when a user cancels native sharing", async () => {
  let copied = false;
  const result = await withNavigator(
    {
      share: async () => { throw new DOMException("Cancelled", "AbortError"); },
      clipboard: { writeText: async () => { copied = true; } },
    },
    () => shareContent({ title: "Local update", url: "https://pethri.com/article/3" })
  );

  assert.equal(result, "cancelled");
  assert.equal(copied, false);
});
