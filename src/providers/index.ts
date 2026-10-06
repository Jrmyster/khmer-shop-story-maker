import type { Project, Tone } from "../types";
import { templateCopy } from "../lib/project";
export interface CopyProvider {
  generate(
    project: Project,
    tone: Tone,
    signal?: AbortSignal,
  ): Promise<{ km: string; en: string }>;
}
export interface TranscriptionProvider {
  transcribe(audio: Blob, signal?: AbortSignal): Promise<string>;
}
export const localProvider: CopyProvider = {
  generate: async (p, tone) => templateCopy(p, tone),
};
export function configuredUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export const AI_URL = configuredUrl(import.meta.env.VITE_AI_PROXY_URL);
export const TRANSCRIPTION_URL = configuredUrl(
  import.meta.env.VITE_TRANSCRIPTION_PROXY_URL,
);
export const aiProvider: CopyProvider = {
  async generate(project, tone, signal) {
    if (!AI_URL) return localProvider.generate(project, tone);
    // AI selects fact order only, never supplies new factual text, prices, or contacts.
    const facts = [
      project.business.description || project.transcript,
      project.business.benefit,
    ].filter(Boolean);
    const response = await fetch(AI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ facts, tone, language: project.outputLanguage }),
      signal: signal ?? AbortSignal.timeout(15000),
      credentials: "omit",
    });
    if (!response.ok) throw new Error("aiError");
    const body = (await response.json()) as { order?: unknown };
    if (
      !Array.isArray(body.order) ||
      body.order.length !== facts.length ||
      new Set(body.order).size !== facts.length ||
      body.order.some((i) => !Number.isInteger(i) || i < 0 || i >= facts.length)
    )
      throw new Error("aiError");
    const copy = (body.order as number[]).map((i) => facts[i]).join("\n");
    return { km: copy, en: copy };
  },
};
export const transcriptionProvider: TranscriptionProvider = {
  async transcribe(audio, signal) {
    if (!TRANSCRIPTION_URL) throw new Error("transcriptionMissing");
    if (audio.size > 8 * 1024 * 1024) throw new Error("transcriptionError");
    const response = await fetch(TRANSCRIPTION_URL, {
      method: "POST",
      headers: { "Content-Type": audio.type || "application/octet-stream" },
      body: audio,
      signal: signal ?? AbortSignal.timeout(30000),
      credentials: "omit",
    });
    if (!response.ok) throw new Error("transcriptionError");
    const data = (await response.json()) as { text?: unknown };
    if (typeof data.text !== "string" || data.text.length > 1500)
      throw new Error("transcriptionError");
    return data.text;
  },
};
export interface PaymentVerifier {
  verifyExportCredit(
    projectId: string,
  ): Promise<{ verified: boolean; receiptId?: string }>;
}
export const premiumFeatures = {
  watermarkFree: false,
  templatePacks: false,
  publicLinks: false,
} as const;
export const disabledPaymentVerifier: PaymentVerifier = {
  verifyExportCredit: async () => ({ verified: false }),
};
