import { it, expect } from "vitest";
import { templates } from "../src/data/templates";
const luminance = (hex: string) => {
  const channels = hex
    .slice(1)
    .match(/../g)!
    .map((c) => parseInt(c, 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};
const ratio = (a: string, b: string) => {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
};
it("keeps template text, prices and contacts at readable contrast", () => {
  for (const palette of Object.values(templates)) {
    expect(ratio(palette.text, palette.background)).toBeGreaterThanOrEqual(4.5);
    for (const foreground of [palette.text, palette.muted, palette.accent])
      expect(ratio(foreground, palette.surface)).toBeGreaterThanOrEqual(4.5);
  }
});
