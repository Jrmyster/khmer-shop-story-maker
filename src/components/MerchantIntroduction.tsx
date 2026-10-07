import { Camera, Clapperboard, Download } from "lucide-react";
import type { T } from "./ui";

const stepIcons = [Camera, Clapperboard, Download];

export function MerchantIntroduction({ t }: { t: T }) {
  return (
    <section className="merchant-introduction" aria-labelledby="merchant-how">
      <h2 id="merchant-how">{t("merchantHow")}</h2>
      <ol className="merchant-steps">
        {stepIcons.map((Icon, index) => (
          <li key={index}>
            <span className="merchant-step-icon" aria-hidden="true">
              <Icon size={20} />
            </span>
            <div>
              <h3>{t("merchantStepTitles", index)}</h3>
              <p>{t("merchantStepBodies", index)}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="merchant-publishing-note">{t("merchantPublishingNote")}</p>
    </section>
  );
}
