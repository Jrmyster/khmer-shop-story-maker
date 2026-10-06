import { it, expect } from "vitest";
import { runInNewContext } from "node:vm";
import { createServiceWorker } from "../scripts/offline-source.mjs";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
it("generates an app-specific cache with all shell files and isolates scope", async () => {
  const root = mkdtempSync(join(tmpdir(), "shop-story-sw-"));
  mkdirSync(join(root, "dist"));
  writeFileSync(join(root, "dist", "index.html"), "shell");
  mkdirSync(join(root, "dist", "assets"));
  writeFileSync(join(root, "dist", "assets", "export.js"), "export");
  try {
    const source = createServiceWorker("test", [
      "index.html",
      "assets/export.js",
    ]);
    const listeners: Record<string, (event: unknown) => void> = {};
    const stored = new Map<string, string>();
    const cache = {
      addAll: async (urls: string[]) => {
        urls.forEach((url) =>
          stored.set(url, url.endsWith("index.html") ? "shell" : "export"),
        );
      },
      match: async (url: string | { url: string }) =>
        stored.get(typeof url === "string" ? url : url.url),
    };
    const deleted: string[] = [];
    const caches = {
      open: async () => cache,
      keys: async () => ["khmerone-shell-old", "shop-story-shell-stale"],
      delete: async (key: string) => {
        deleted.push(key);
        return true;
      },
    };
    runInNewContext(source, {
      URL,
      self: {
        location: { href: "https://shop.example/app/sw.js" },
        clients: { claim: async () => {} },
        addEventListener: (type: string, fn: (event: unknown) => void) => {
          listeners[type] = fn;
        },
      },
      caches,
      fetch: async () => {
        throw new Error("offline");
      },
    });
    let waiting: Promise<unknown> | undefined;
    listeners.install({
      waitUntil: (p: Promise<unknown>) => {
        waiting = p;
      },
    });
    await waiting;
    expect(stored.has("https://shop.example/app/assets/export.js")).toBe(true);
    listeners.activate({
      waitUntil: (p: Promise<unknown>) => {
        waiting = p;
      },
    });
    await waiting;
    expect(deleted).toEqual(["shop-story-shell-stale"]);
    let response: Promise<unknown> | undefined;
    listeners.fetch({
      request: {
        url: "https://shop.example/app/",
        method: "GET",
        mode: "navigate",
      },
      respondWith: (p: Promise<unknown>) => {
        response = p;
      },
    });
    expect(await response).toBe("shell");
    response = undefined;
    listeners.fetch({
      request: {
        url: "https://shop.example/other/",
        method: "GET",
        mode: "navigate",
      },
      respondWith: (p: Promise<unknown>) => {
        response = p;
      },
    });
    expect(response).toBeUndefined();
    listeners.fetch({
      request: { url: "https://shop.example/app/api", method: "POST" },
      respondWith: (p: Promise<unknown>) => {
        response = p;
      },
    });
    expect(response).toBeUndefined();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
