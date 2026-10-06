import { en, type TranslationKey } from "./en";
import { km } from "./km";
import type { Language } from "../types";
export { en, km };
export function translate(
  lang: Language,
  key: TranslationKey,
  index?: number,
): string {
  const pick = (dict: typeof km | typeof en) => {
    const v = dict[key];
    return typeof v === "string" ? v : (v[index ?? 0] ?? "");
  };
  if (lang !== "both") return pick(lang === "km" ? km : en);
  const khmer = pick(km);
  const english = pick(en);
  return khmer === english ? khmer : `${khmer} · ${english}`;
}
