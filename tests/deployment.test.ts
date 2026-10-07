import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Cloudflare deployment routing", () => {
  const config = JSON.parse(readFileSync("wrangler.json", "utf8"));

  it("uses native Workers SPA fallback without a looping redirect", () => {
    expect(config.name).toBe("khmer-shop-story-maker");
    expect(config.assets.directory).toBe("./dist");
    expect(config.assets.not_found_handling).toBe("single-page-application");
    expect(existsSync("public/_redirects")).toBe(false);
    expect(existsSync("public/404.html")).toBe(false);
  });

  it("uploads the existing build without introducing backend bindings or a rebuild", () => {
    expect(config.main).toBeUndefined();
    expect(config.build).toBeUndefined();
    expect(config.vars).toBeUndefined();
    expect(config.services).toBeUndefined();
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    expect(pkg.scripts["deploy:cloudflare"]).toBe(
      "npx --yes wrangler@4.148.0 deploy --config wrangler.json",
    );
  });
});
