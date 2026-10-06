import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
import { Blob, File } from "node:buffer";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
Object.defineProperty(globalThis, "Blob", { value: Blob, configurable: true });
Object.defineProperty(globalThis, "File", { value: File, configurable: true });
Object.defineProperty(URL, "createObjectURL", {
  value: vi.fn(() => `blob:test-${Math.random()}`),
  configurable: true,
});
Object.defineProperty(URL, "revokeObjectURL", {
  value: vi.fn(),
  configurable: true,
});
Object.defineProperty(document, "fonts", {
  value: { ready: Promise.resolve(), load: () => Promise.resolve([]) },
  configurable: true,
});
Object.defineProperty(window, "matchMedia", {
  value: vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
  configurable: true,
});
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute("open", "");
};
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute("open");
};
Element.prototype.scrollIntoView = vi.fn();
vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
afterEach(() => {
  cleanup();
  localStorage.clear();
});
