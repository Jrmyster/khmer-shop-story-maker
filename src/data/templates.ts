import type { TemplateId } from "../types";
export interface Palette {
  background: string;
  surface: string;
  accent: string;
  text: string;
  muted: string;
  secondary: string;
}
export const templates: Record<TemplateId, Palette> = {
  sunrise: {
    background: "#fff4d9",
    surface: "#ffffff",
    accent: "#a94e00",
    text: "#302419",
    muted: "#6d5646",
    secondary: "#ffb703",
  },
  market: {
    background: "#101829",
    surface: "#1b2940",
    accent: "#5ce2ce",
    text: "#ffffff",
    muted: "#cad3e3",
    secondary: "#ffb703",
  },
  clean: {
    background: "#f5faf6",
    surface: "#ffffff",
    accent: "#237354",
    text: "#123529",
    muted: "#486c5b",
    secondary: "#d4eeda",
  },
  festival: {
    background: "#891b24",
    surface: "#a82730",
    accent: "#ffd271",
    text: "#ffffff",
    muted: "#ffe7d5",
    secondary: "#ffb703",
  },
};
