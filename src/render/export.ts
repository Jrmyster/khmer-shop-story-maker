import type { Project } from "../types";
import { recordingSupport } from "../lib/capabilities";
import { drawStory, loadAssets } from "./canvas";
export async function exportPng(p: Project, order: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = p.resolution;
  canvas.height = (p.resolution * 16) / 9;
  drawStory(
    canvas,
    p,
    await loadAssets({ ...p, photos: p.photos.slice(0, 1) }),
    0,
    order,
  );
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("exportError"))),
      "image/png",
    ),
  );
}
export async function exportVideo(
  p: Project,
  onProgress: (fraction: number) => void,
  signal: AbortSignal,
): Promise<{ blob: Blob; extension: string }> {
  const support = recordingSupport();
  if (!support) throw new Error("videoUnsupported");
  const assets = await loadAssets(p);
  if (signal.aborted) throw new Error("exportCancelled");
  const canvas = document.createElement("canvas");
  canvas.width = p.resolution;
  canvas.height = (p.resolution * 16) / 9;
  canvas.style.cssText =
    "position:fixed;left:0;bottom:0;width:1px;height:2px;pointer-events:none;z-index:-1";
  document.body.append(canvas);
  let stream: MediaStream | undefined;
  let audio: AudioContext | undefined;
  let source: AudioBufferSourceNode | undefined;
  let raf = 0;
  let watchdog: ReturnType<typeof setTimeout> | undefined;
  let recorder: MediaRecorder | undefined;
  let removeListeners = () => {};
  try {
    drawStory(canvas, p, assets, 0);
    stream = canvas.captureStream(24);
    if (p.keepVoice && p.voice) {
      audio = new AudioContext();
      await audio.resume();
      source = audio.createBufferSource();
      source.buffer = await audio.decodeAudioData(await p.voice.arrayBuffer());
      const destination = audio.createMediaStreamDestination();
      source.connect(destination);
      for (const track of destination.stream.getAudioTracks())
        stream.addTrack(track);
    }
    if (signal.aborted) throw new Error("exportCancelled");
    recorder = new MediaRecorder(stream, {
      mimeType: support.mime,
      videoBitsPerSecond: p.resolution === 1080 ? 5_000_000 : 2_500_000,
    });
    const chunks: Blob[] = [];
    let totalBytes = 0;
    const blob = await new Promise<Blob>((resolve, reject) => {
      let settled = false;
      const fail = (key = "exportCancelled") => {
        if (settled) return;
        settled = true;
        removeListeners();
        reject(new Error(key));
      };
      const abort = () => fail();
      const visibility = () => {
        if (document.hidden) fail();
      };
      removeListeners = () => {
        signal.removeEventListener("abort", abort);
        document.removeEventListener("visibilitychange", visibility);
      };
      signal.addEventListener("abort", abort, { once: true });
      document.addEventListener("visibilitychange", visibility);
      recorder!.ondataavailable = (event) => {
        if (event.data.size) {
          chunks.push(event.data);
          totalBytes += event.data.size;
        }
        if (totalBytes > 40 * 1024 * 1024) fail("exportError");
      };
      recorder!.onerror = () => fail("exportError");
      recorder!.onstop = () => {
        removeListeners();
        if (settled) return;
        settled = true;
        const output = new Blob(chunks, { type: recorder!.mimeType });
        if (output.size > 1000) resolve(output);
        else reject(new Error("exportError"));
      };
      try {
        recorder!.start(1000);
        source?.start();
      } catch {
        fail("exportError");
        return;
      }
      const start = performance.now();
      const frame = (now: number) => {
        if (settled) return;
        if (signal.aborted) {
          fail();
          return;
        }
        try {
          const elapsed = (now - start) / 1000;
          drawStory(canvas, p, assets, Math.min(elapsed, p.duration));
          onProgress(Math.min(1, elapsed / p.duration));
          if (elapsed >= p.duration) {
            recorder!.stop();
            return;
          }
          raf = requestAnimationFrame(frame);
        } catch {
          fail("exportError");
        }
      };
      raf = requestAnimationFrame(frame);
      watchdog = setTimeout(
        () => fail("exportError"),
        (p.duration + 12) * 1000,
      );
    });
    if (watchdog) clearTimeout(watchdog);
    if (signal.aborted) throw new Error("exportCancelled");
    // A codec-support query alone does not prove that the captured file can play.
    const url = URL.createObjectURL(blob);
    const video = document.createElement("video");
    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("exportError")),
          7000,
        );
        video.muted = true;
        video.playsInline = true;
        video.onloadeddata = () => {
          clearTimeout(timeout);
          resolve();
        };
        video.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("exportError"));
        };
        video.src = url;
        video.load();
      });
    } finally {
      video.onloadeddata = null;
      video.onerror = null;
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
    }
    if (signal.aborted) throw new Error("exportCancelled");
    return { blob, extension: blob.type.includes("mp4") ? "mp4" : "webm" };
  } finally {
    removeListeners();
    cancelAnimationFrame(raf);
    if (watchdog) clearTimeout(watchdog);
    try {
      if (recorder && recorder.state !== "inactive") recorder.stop();
    } catch {
      /* recorder already failed */
    }
    try {
      source?.stop();
    } catch {
      /* source already stopped */
    }
    stream?.getTracks().forEach((track) => track.stop());
    try {
      await audio?.close();
    } catch {
      /* audio context was closed by the browser */
    }
    canvas.remove();
  }
}
