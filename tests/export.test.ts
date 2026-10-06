import { it, expect, vi, afterEach } from "vitest";
import { exportVideo } from "../src/render/export";
import { newProject } from "../src/lib/project";
vi.mock("../src/render/canvas", () => ({
  loadAssets: vi.fn(async () => ({ photos: [], logo: null, qr: null })),
  drawStory: vi.fn(),
}));
afterEach(() => vi.unstubAllGlobals());
it("cancels an interrupted export and releases capture resources", async () => {
  const stop = vi.fn();
  Object.defineProperty(HTMLCanvasElement.prototype, "captureStream", {
    configurable: true,
    value: () => ({ getTracks: () => [{ stop }] }),
  });
  class Recorder {
    static isTypeSupported() {
      return true;
    }
    state = "inactive";
    mimeType = "video/mp4";
    onstop: (() => void) | null = null;
    ondataavailable: ((event: { data: Blob }) => void) | null = null;
    start() {
      this.state = "recording";
    }
    stop() {
      this.state = "inactive";
      this.onstop?.();
    }
  }
  vi.stubGlobal("MediaRecorder", Recorder);
  const controller = new AbortController();
  const progress = vi.fn();
  const promise = exportVideo(newProject(), progress, controller.signal);
  await Promise.resolve();
  await Promise.resolve();
  controller.abort();
  await expect(promise).rejects.toThrow("exportCancelled");
  expect(stop).toHaveBeenCalled();
  expect(document.querySelector("canvas")).toBe(null);
});
it("does not create a recording surface if already cancelled", async () => {
  const controller = new AbortController();
  controller.abort();
  vi.stubGlobal(
    "MediaRecorder",
    class {
      static isTypeSupported() {
        return true;
      }
    },
  );
  Object.defineProperty(HTMLCanvasElement.prototype, "captureStream", {
    configurable: true,
    value: () => null,
  });
  await expect(
    exportVideo(newProject(), vi.fn(), controller.signal),
  ).rejects.toThrow("exportCancelled");
  expect(document.querySelector("canvas")).toBe(null);
});
