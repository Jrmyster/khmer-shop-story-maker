import { useEffect, useRef, useState } from "react";
import { Play, Pause, Image as ImageIcon } from "lucide-react";
import type { Project } from "../types";
import {
  captionCues,
  drawStory,
  loadAssets,
  type Assets,
} from "../render/canvas";
import type { T } from "./ui";
export function Preview({ project, t }: { project: Project; t: T }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [assets, setAssets] = useState<Assets | null>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [order, setOrder] = useState(false);
  const [error, setError] = useState(false);
  const { photos, logo, khqr } = project;
  useEffect(() => {
    let active = true;
    setError(false);
    loadAssets({ photos, logo, khqr })
      .then((value) => {
        if (active) setAssets(value);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [photos, logo, khqr]);
  useEffect(() => {
    if (canvas.current && assets) {
      try {
        drawStory(
          canvas.current,
          project,
          assets,
          Math.min(time, project.duration),
          order,
        );
      } catch {
        setError(true);
      }
    }
  }, [assets, project, time, order]);
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const start = performance.now() - time * 1000;
    const loop = (now: number) => {
      const value = (now - start) / 1000;
      if (value >= project.duration) {
        setTime(0);
        setPlaying(false);
      } else {
        setTime(value);
        frame = requestAnimationFrame(loop);
      }
    };
    frame = requestAnimationFrame(loop);
    return () =>
      cancelAnimationFrame(frame); /* time is captured at playback start */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, project.duration]);
  const cues = captionCues(project);
  return (
    <section className="preview-panel" aria-label={t("preview")}>
      <div className="eyebrow">
        <span className="live-dot" />
        {t("preview")} <span>9:16</span>
      </div>
      <div className="phone-preview">
        <canvas
          ref={canvas}
          width={360}
          height={640}
          role="img"
          aria-label={`${project.business.product || t("preview")} · ${project.business.shop}`}
        />
        <div className="safe-area" aria-hidden="true" />
        {!project.photos.length && (
          <div className="preview-empty">
            <ImageIcon size={36} />
            <span>{t("emptyPhoto")}</span>
          </div>
        )}
      </div>
      {error && <p role="alert">{t("imageDecode")}</p>}
      <div className="preview-controls">
        <button
          className="icon-btn"
          onClick={() => {
            setOrder(false);
            setPlaying((v) => !v);
          }}
          aria-label={t(playing ? "pausePreview" : "playPreview")}
        >
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <input
          type="range"
          min={0}
          max={project.duration}
          step={0.1}
          value={Math.min(time, project.duration)}
          aria-label={t("timing")}
          onChange={(e) => {
            setPlaying(false);
            setOrder(false);
            setTime(Number(e.target.value));
          }}
        />
        <span>{Math.floor(time)}s</span>
      </div>
      <label className="check">
        <input
          type="checkbox"
          checked={order}
          onChange={(e) => {
            setPlaying(false);
            setOrder(e.target.checked);
          }}
        />
        {t("orderFrame")}
      </label>
      <p className="hint">{t("previewHint")}</p>
      {project.step === 4 && (
        <ol className="cues" aria-label={t("timing")}>
          {cues.length ? (
            cues.map((cue, i) => (
              <li key={i}>
                <button
                  onClick={() => {
                    setPlaying(false);
                    setTime(cue.start);
                    setOrder(false);
                  }}
                >
                  <span>
                    {cue.start.toFixed(1)}–{cue.end.toFixed(1)}s
                  </span>
                  {cue.text}
                </button>
              </li>
            ))
          ) : (
            <li>{t("noCaption")}</li>
          )}
        </ol>
      )}
    </section>
  );
}
