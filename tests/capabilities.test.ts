import { it, expect } from "vitest";
import { recordingSupport } from "../src/lib/capabilities";
it("returns a fallback instead of assuming MediaRecorder exists", () => {
  expect(recordingSupport(undefined, false)).toBe(null);
});
it("chooses MP4 where actually supported and WebM otherwise", () => {
  const mp4 = {
    isTypeSupported: (mime: string) => mime.includes("mp4"),
  } as unknown as typeof MediaRecorder;
  const webm = {
    isTypeSupported: (mime: string) => mime.includes("webm"),
  } as unknown as typeof MediaRecorder;
  expect(recordingSupport(mp4, true)?.extension).toBe("mp4");
  expect(recordingSupport(webm, true)?.extension).toBe("webm");
});
it("rejects capture-unavailable or unsupported codecs", () => {
  const none = {
    isTypeSupported: () => false,
  } as unknown as typeof MediaRecorder;
  expect(recordingSupport(none, true)).toBe(null);
  expect(recordingSupport(none, false)).toBe(null);
});
