import type { RecordingSupport } from "../types";
export function recordingSupport(
  recorder: typeof MediaRecorder | undefined = globalThis.MediaRecorder,
  capture: boolean = typeof HTMLCanvasElement !== "undefined" &&
    typeof HTMLCanvasElement.prototype.captureStream === "function",
): RecordingSupport | null {
  if (!recorder || !capture) return null;
  for (const mime of [
    "video/mp4;codecs=avc1.42E01E",
    "video/mp4",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ]) {
    try {
      if (recorder.isTypeSupported(mime))
        return {
          mime,
          extension: mime.startsWith("video/mp4") ? "mp4" : "webm",
        };
    } catch {
      /* Capability queries can throw in older browsers. */
    }
  }
  return null;
}
export function audioMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return [
    "audio/mp4",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
  ].find((t) => MediaRecorder.isTypeSupported(t));
}
