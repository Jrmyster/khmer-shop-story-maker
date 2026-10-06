import { it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Voice } from "../src/components/Voice";
import { newProject } from "../src/lib/project";
import { translate } from "../src/locales";
const t = (key: Parameters<typeof translate>[1], index?: number) =>
  translate("en", key, index);
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it("handles an explicit microphone permission denial", async () => {
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia: vi
        .fn()
        .mockRejectedValue(new DOMException("Denied", "NotAllowedError")),
    },
  });
  vi.stubGlobal("MediaRecorder", class {});
  const notice = vi.fn();
  render(
    <Voice
      project={newProject()}
      update={vi.fn()}
      t={t}
      notice={notice}
      confirm={vi.fn()}
    />,
  );
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "Record narration" })),
  );
  expect(notice).toHaveBeenCalledWith("microphoneError");
});
it("stops automatically after 20 seconds and releases microphone tracks", async () => {
  vi.useFakeTimers();
  const stop = vi.fn();
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop }] }),
    },
  });
  class Recorder {
    static isTypeSupported() {
      return true;
    }
    state = "inactive";
    mimeType = "audio/webm";
    ondataavailable: ((event: { data: Blob }) => void) | null = null;
    onstop: (() => void) | null = null;
    start() {
      this.state = "recording";
    }
    stop() {
      this.state = "inactive";
      this.ondataavailable?.({ data: new Blob(["voice"]) });
      this.onstop?.();
    }
  }
  vi.stubGlobal("MediaRecorder", Recorder);
  const update = vi.fn();
  const { unmount } = render(
    <Voice
      project={newProject()}
      update={update}
      t={t}
      notice={vi.fn()}
      confirm={vi.fn()}
    />,
  );
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "Record narration" })),
  );
  expect(
    screen.getByRole("button", { name: "Stop recording" }),
  ).toBeInTheDocument();
  await act(async () => vi.advanceTimersByTime(20000));
  expect(stop).toHaveBeenCalled();
  expect(update).toHaveBeenCalledWith(
    expect.objectContaining({ voice: expect.any(Blob), keepVoice: true }),
  );
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
