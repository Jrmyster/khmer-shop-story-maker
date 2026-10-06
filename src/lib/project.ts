import type { Project, Language, Currency, Tone, Cta } from "../types";
export function newId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return [...crypto.getRandomValues(new Uint8Array(16))]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
export const newProject = (): Project => ({
  version: 1,
  id: newId(),
  updatedAt: Date.now(),
  business: {
    shop: "",
    product: "",
    category: "food",
    khr: "",
    usd: "",
    currency: "KHR",
    phone: "",
    telegram: "",
    facebook: "",
    location: "",
    tagline: "",
    description: "",
    benefit: "",
    order: "",
  },
  photos: [],
  logo: null,
  khqr: null,
  voice: null,
  voiceDuration: 0,
  keepVoice: true,
  transcript: "",
  copyKm: "",
  copyEn: "",
  tone: "friendly",
  outputLanguage: "km",
  template: "sunrise",
  cta: "order",
  captionSize: 32,
  captionPosition: "bottom",
  duration: 15,
  resolution: 720,
  step: 0,
});
export function validPrice(value: string): boolean {
  return (
    value.trim() === "" ||
    /^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/.test(value.trim())
  );
}
export function formatPrice(
  khr: string,
  usd: string,
  currency: Currency,
): string {
  const format = (v: string, symbol: string) =>
    v.trim() && validPrice(v)
      ? `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Number(v))} ${symbol}`
      : "";
  return [
    currency !== "USD" ? format(khr, "៛") : "",
    currency !== "KHR" ? format(usd, "USD") : "",
  ]
    .filter(Boolean)
    .join(" · ");
}
export function safeText(value: unknown, max = 600): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}
export function restoreProject(input: unknown): Project | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Partial<Project>;
  if (
    raw.version !== 1 ||
    typeof raw.id !== "string" ||
    !raw.business ||
    !Array.isArray(raw.photos)
  )
    return null;
  const fresh = newProject();
  const business = { ...fresh.business };
  for (const key of Object.keys(business) as (keyof typeof business)[]) {
    if (key === "currency") continue;
    business[key] = safeText(
      raw.business[key],
      key === "description" ? 1500 : 300,
    );
  }
  business.currency = (["KHR", "USD", "both"] as const).includes(
    raw.business.currency,
  )
    ? raw.business.currency
    : "KHR";
  const clamp = (n: unknown, min: number, max: number, fallback: number) =>
    typeof n === "number" && Number.isFinite(n)
      ? Math.max(min, Math.min(max, n))
      : fallback;
  const blob = (b: unknown) =>
    b instanceof Blob && b.size <= 12 * 1024 * 1024 ? b : null;
  return {
    ...fresh,
    id: raw.id,
    updatedAt: clamp(raw.updatedAt, 0, Number.MAX_SAFE_INTEGER, Date.now()),
    business,
    photos: raw.photos.slice(0, 5).flatMap((p) =>
      p && blob(p.blob) && typeof p.id === "string"
        ? [
            {
              id: p.id,
              blob: p.blob,
              x: clamp(p.x, 0, 100, 50),
              y: clamp(p.y, 0, 100, 50),
              zoom: clamp(p.zoom, 1, 2, 1),
            },
          ]
        : [],
    ),
    logo: blob(raw.logo),
    khqr: blob(raw.khqr),
    voice: blob(raw.voice),
    voiceDuration: clamp(raw.voiceDuration, 0, 20, 0),
    keepVoice: raw.keepVoice !== false,
    transcript: safeText(raw.transcript, 1500),
    copyKm: safeText(raw.copyKm, 1200),
    copyEn: safeText(raw.copyEn, 1200),
    tone:
      raw.tone &&
      ["short", "friendly", "urgent", "informative"].includes(raw.tone)
        ? raw.tone
        : "friendly",
    outputLanguage:
      raw.outputLanguage && ["en", "km", "both"].includes(raw.outputLanguage)
        ? raw.outputLanguage
        : "km",
    template:
      raw.template &&
      ["sunrise", "market", "clean", "festival"].includes(raw.template)
        ? raw.template
        : "sunrise",
    cta:
      raw.cta && ["order", "telegram", "call", "scan"].includes(raw.cta)
        ? raw.cta
        : "order",
    captionSize: clamp(raw.captionSize, 24, 48, 32),
    captionPosition: raw.captionPosition === "top" ? "top" : "bottom",
    duration: clamp(raw.duration, 10, 20, 15),
    resolution: raw.resolution === 1080 ? 1080 : 720,
    step: Math.floor(clamp(raw.step, 0, 6, 0)),
  };
}
const ctas: Record<Cta, { en: string; km: string }> = {
  order: { en: "Order now", km: "បញ្ជាទិញឥឡូវនេះ" },
  telegram: { en: "Message us on Telegram", km: "ផ្ញើសារតាម Telegram" },
  call: { en: "Call to order", km: "ទូរស័ព្ទដើម្បីបញ្ជាទិញ" },
  scan: { en: "Scan to pay", km: "ស្កេនដើម្បីបង់ប្រាក់" },
};
export function ctaText(cta: Cta, lang: Language): string {
  return lang === "both" ? `${ctas[cta].km}\n${ctas[cta].en}` : ctas[cta][lang];
}
export function templateCopy(
  p: Project,
  tone: Tone,
): { km: string; en: string } {
  // Facts are verbatim, not generated: tone changes structure, never invents claims or offers.
  const facts = [
    p.business.description || p.transcript,
    p.business.benefit,
  ].filter(Boolean);
  const short = facts.slice(0, 1);
  const content = tone === "short" ? short : facts;
  return { en: content.join("\n"), km: content.join("\n") };
}
export function ready(p: Project): boolean {
  return (
    !!p.business.shop.trim() &&
    !!p.business.product.trim() &&
    p.photos.length > 0 &&
    (p.business.currency === "USD" || validPrice(p.business.khr)) &&
    (p.business.currency === "KHR" || validPrice(p.business.usd))
  );
}
