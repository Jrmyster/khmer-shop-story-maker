import { describe, it, expect } from "vitest";
import {
  newProject,
  formatPrice,
  validPrice,
  restoreProject,
  templateCopy,
  ready,
} from "../src/lib/project";
import { captionCues } from "../src/render/canvas";
import {
  disabledPaymentVerifier,
  premiumFeatures,
  configuredUrl,
} from "../src/providers";
describe("merchant facts and project integrity", () => {
  it("formats riel, dollars and manual dual prices without conversion", () => {
    expect(formatPrice("2000", "1.25", "KHR")).toBe("2,000 ៛");
    expect(formatPrice("2000", "1.25", "USD")).toBe("1.25 USD");
    expect(formatPrice("2000", "1.25", "both")).toBe("2,000 ៛ · 1.25 USD");
  });
  it.each(["-4", "NaN", "<script>", "4.123", "1e4", "9999999999"])(
    "rejects invalid price %s",
    (value) => expect(validPrice(value)).toBe(false),
  );
  it("keeps zero and omitted prices, never guesses an amount", () => {
    expect(validPrice("0")).toBe(true);
    expect(formatPrice("", "", "both")).toBe("");
  });
  it("restores a versioned draft and clamps unexpected values", () => {
    const p = newProject();
    expect(
      restoreProject({
        ...p,
        captionSize: 1000,
        duration: 900,
        resolution: 300,
        step: 8,
      })?.captionSize,
    ).toBe(48);
    expect(restoreProject({ ...p, duration: 900 })?.duration).toBe(20);
    expect(restoreProject({ version: 2 })).toBe(null);
  });
  it("cannot invent facts with any copy style", () => {
    const p = newProject();
    p.business.description = "Eggs, 6,000 KHR.";
    p.business.benefit = "Delivered to your door.";
    for (const style of [
      "short",
      "friendly",
      "urgent",
      "informative",
    ] as const) {
      const result = templateCopy(p, style);
      expect(result.en).toContain(p.business.description);
      expect(result.km).not.toContain("discount");
    }
  });
  it("requires at least one image and names for export", () => {
    const p = newProject();
    expect(ready(p)).toBe(false);
    p.business.shop = "Test";
    p.business.product = "Rice";
    p.photos = [
      { id: "one", blob: new Blob(["photo"]), x: 50, y: 50, zoom: 1 },
    ];
    expect(ready(p)).toBe(true);
    p.business.khr = "-2";
    expect(ready(p)).toBe(false);
  });
  it("has stable bilingual caption timing with reserved order screen", () => {
    const p = newProject();
    p.outputLanguage = "both";
    p.copyKm = "ជំរាបសួរ";
    p.copyEn = "Hello";
    p.duration = 10;
    const cues = captionCues(p);
    expect(cues).toHaveLength(2);
    expect(cues[0].start).toBe(0);
    expect(cues[1].end).toBe(7.6);
  });
  it("never unlocks premium exports based on a QR image", async () => {
    expect(premiumFeatures.watermarkFree).toBe(false);
    expect(await disabledPaymentVerifier.verifyExportCredit("a")).toEqual({
      verified: false,
    });
  });
  it("requires HTTPS for optional service URLs", () => {
    expect(configuredUrl("javascript:alert(1)")).toBe(null);
    expect(configuredUrl("http://example.com")).toBe(null);
    expect(configuredUrl("https://example.com")).toBe("https://example.com/");
  });
});
