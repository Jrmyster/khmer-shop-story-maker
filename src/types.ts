export type Language = "km" | "en" | "both";
export type Tone = "short" | "friendly" | "urgent" | "informative";
export type TemplateId = "sunrise" | "market" | "clean" | "festival";
export type Currency = "KHR" | "USD" | "both";
export type Cta = "order" | "telegram" | "call" | "scan";
export interface Business {
  shop: string;
  product: string;
  category: string;
  khr: string;
  usd: string;
  currency: Currency;
  phone: string;
  telegram: string;
  facebook: string;
  location: string;
  tagline: string;
  description: string;
  benefit: string;
  order: string;
}
export interface Photo {
  id: string;
  blob: Blob;
  x: number;
  y: number;
  zoom: number;
}
export interface Project {
  version: 1;
  id: string;
  updatedAt: number;
  business: Business;
  photos: Photo[];
  logo: Blob | null;
  khqr: Blob | null;
  voice: Blob | null;
  voiceDuration: number;
  keepVoice: boolean;
  transcript: string;
  copyKm: string;
  copyEn: string;
  tone: Tone;
  outputLanguage: Language;
  template: TemplateId;
  cta: Cta;
  captionSize: number;
  captionPosition: "top" | "bottom";
  duration: number;
  resolution: 720 | 1080;
  step: number;
}
export interface CaptionCue {
  start: number;
  end: number;
  text: string;
}
export interface RecordingSupport {
  mime: string;
  extension: string;
}
