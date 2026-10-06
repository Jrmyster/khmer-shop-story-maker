import { it, expect } from "vitest";
import {
  validateImage,
  hasImageSignature,
  MAX_IMAGE_SIZE,
  resizeDimensions,
} from "../src/lib/images";
it("rejects oversized, empty or unsupported images", () => {
  expect(validateImage({ type: "image/heic", size: 50 })).toBe("imageType");
  expect(validateImage({ type: "image/png", size: MAX_IMAGE_SIZE + 1 })).toBe(
    "imageSize",
  );
  expect(validateImage({ type: "image/png", size: 0 })).toBe("imageSize");
  expect(validateImage({ type: "image/jpeg", size: 20 })).toBe(null);
});
it("checks actual file bytes rather than trusting the extension", async () => {
  expect(await hasImageSignature(new Blob(["fake.png"]))).toBe(false);
  expect(
    await hasImageSignature(new Blob([new Uint8Array([255, 216, 255, 1])])),
  ).toBe(true);
  expect(
    await hasImageSignature(
      new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])]),
    ),
  ).toBe(true);
});
it("resizes with preserved aspect ratio without upscaling", () => {
  expect(resizeDimensions(4000, 3000)).toEqual({ width: 1600, height: 1200 });
  expect(resizeDimensions(500, 900)).toEqual({ width: 500, height: 900 });
});
