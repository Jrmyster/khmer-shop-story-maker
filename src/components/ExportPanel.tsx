import { useEffect, useRef, useState } from "react";
import { Download, Film, Share2 } from "lucide-react";
import type { Project } from "../types";
import { recordingSupport } from "../lib/capabilities";
import { ready } from "../lib/project";
import { useBlobUrl, type T } from "./ui";
import type { TranslationKey } from "../locales/en";
export function ExportPanel({
  project,
  update,
  t,
  notice,
}: {
  project: Project;
  update: (p: Partial<Project>) => void;
  t: T;
  notice: (k: TranslationKey) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    blob: Blob;
    extension: string;
  } | null>(null);
  const [order, setOrder] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const url = useBlobUrl(result?.blob ?? null);
  const support = recordingSupport();
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      abort.current?.abort();
    };
  }, []);
  async function render(video: boolean) {
    if (!ready(project)) {
      notice("validation");
      return;
    }
    setBusy(true);
    setIsVideo(video);
    setResult(null);
    setProgress(0);
    const controller = new AbortController();
    abort.current = controller;
    try {
      const renderer = await import("../render/export");
      if (controller.signal.aborted) throw new Error("exportCancelled");
      const output = video
        ? await renderer.exportVideo(
            project,
            (p) => {
              if (mounted.current) setProgress(p);
            },
            controller.signal,
          )
        : { blob: await renderer.exportPng(project, order), extension: "png" };
      if (mounted.current && !controller.signal.aborted) setResult(output);
    } catch (error) {
      if (mounted.current)
        notice(
          (error as Error).message === "exportCancelled"
            ? "exportCancelled"
            : "exportError",
        );
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  async function share() {
    if (!result) return;
    const file = new File([result.blob], `shop-story.${result.extension}`, {
      type: result.blob.type,
    });
    try {
      if (navigator.canShare?.({ files: [file] }))
        await navigator.share({ files: [file], title: project.business.shop });
      else notice("shareUnsupported");
    } catch (error) {
      if ((error as Error).name !== "AbortError") notice("shareUnsupported");
    }
  }
  return (
    <>
      <h2>{t("exportHeading")}</h2>
      <div className="field-grid">
        <label className="field">
          <span>
            {t("duration")} · {project.duration}
          </span>
          <input
            disabled={busy}
            type="range"
            min={10}
            max={20}
            value={project.duration}
            onChange={(e) => update({ duration: Number(e.target.value) })}
          />
        </label>
        <label className="field">
          <span>{t("resolution")}</span>
          <select
            disabled={busy}
            value={project.resolution}
            onChange={(e) =>
              update({ resolution: Number(e.target.value) as 720 | 1080 })
            }
          >
            <option value={720}>{t("lowResolution")}</option>
            <option value={1080}>{t("highResolution")}</option>
          </select>
        </label>
      </div>
      <label className="check">
        <input
          disabled={busy}
          type="checkbox"
          checked={order}
          onChange={(e) => setOrder(e.target.checked)}
        />
        {t("finalFrame")}
      </label>
      <p className="hint">{t("exportFacts")}</p>
      <div className="export-actions">
        <button
          className="primary"
          disabled={busy}
          onClick={() => void render(false)}
        >
          <Download size={18} />
          {t("exportImage")}
        </button>
        <button
          className="secondary"
          disabled={busy || !support}
          onClick={() => void render(true)}
        >
          <Film size={18} />
          {t("exportVideo")}
        </button>
      </div>
      <p className="notice">
        {t(
          !support
            ? "videoUnsupported"
            : support.extension === "mp4"
              ? "mp4Notice"
              : "webmNotice",
        )}
      </p>
      {busy && (
        <div role="status">
          <p>{t(isVideo ? "exporting" : "exportingImage")}</p>
          <progress
            value={progress}
            max={1}
            aria-label={t(isVideo ? "exporting" : "exportingImage")}
          />
          <button className="secondary" onClick={() => abort.current?.abort()}>
            {t("cancelExport")}
          </button>
        </div>
      )}
      {result && url && (
        <div className="result">
          <h3>{t("exportReady")}</h3>
          {result.extension === "png" ? (
            <img className="result-image" src={url} alt={t("preview")} />
          ) : (
            <video className="result-image" src={url} controls playsInline />
          )}
          <div className="row wrap">
            <a
              className="primary"
              href={url}
              download={`shop-story.${result.extension}`}
            >
              <Download size={18} />
              {t("download")} .{result.extension}
            </a>
            <button className="secondary" onClick={() => void share()}>
              <Share2 size={18} />
              {t("share")}
            </button>
          </div>
        </div>
      )}
      <p className="hint">{t("watermark")}</p>
      <p className="hint">{t("noPublicLink")}</p>
    </>
  );
}
