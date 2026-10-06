import { useState, useRef, useEffect } from "react";
import { Camera, ImagePlus, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import type { Photo, Project } from "../types";
import { compressImage } from "../lib/images";
import { newId } from "../lib/project";
import { useBlobUrl, type T } from "./ui";
import type { TranslationKey } from "../locales/en";
export function PhotoCard({
  photo,
  index,
  count,
  onChange,
  onRemove,
  onMove,
  onReplace,
  t,
}: {
  photo: Photo;
  index: number;
  count: number;
  onChange: (p: Photo) => void;
  onRemove: () => void;
  onMove: (delta: number) => void;
  onReplace: (file: File) => void;
  t: T;
}) {
  const url = useBlobUrl(photo.blob);
  return (
    <article className="photo-card">
      <div className="photo-top">
        <strong>
          {t("photo")} {index + 1}
        </strong>
        <div className="row">
          <button
            className="icon-btn"
            disabled={index === 0}
            aria-label={`${t("moveUp")} ${index + 1}`}
            onClick={() => onMove(-1)}
          >
            <ArrowUp size={18} />
          </button>
          <button
            className="icon-btn"
            disabled={index === count - 1}
            aria-label={`${t("moveDown")} ${index + 1}`}
            onClick={() => onMove(1)}
          >
            <ArrowDown size={18} />
          </button>
          <button
            className="icon-btn danger"
            aria-label={`${t("remove")} ${t("photo")} ${index + 1}`}
            onClick={onRemove}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      <div className="crop-preview">
        <img
          src={url}
          alt={`${t("photo")} ${index + 1}`}
          style={{
            objectPosition: `${photo.x}% ${photo.y}%`,
            transform: `scale(${photo.zoom})`,
            transformOrigin: `${photo.x}% ${photo.y}%`,
          }}
        />
      </div>
      <div className="crop-sliders">
        {(["x", "y", "zoom"] as const).map((key, i) => (
          <label key={key}>
            {t((["horizontal", "vertical", "zoom"] as const)[i])}
            <input
              type="range"
              min={key === "zoom" ? 1 : 0}
              max={key === "zoom" ? 2 : 100}
              step={key === "zoom" ? 0.05 : 1}
              value={photo[key]}
              onChange={(e) =>
                onChange({ ...photo, [key]: Number(e.target.value) })
              }
            />
          </label>
        ))}
      </div>
      <label className="upload secondary">
        {t("replace")}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onReplace(file);
            e.target.value = "";
          }}
        />
      </label>
    </article>
  );
}
export function Photos({
  project,
  onChange,
  t,
  notice,
}: {
  project: Project;
  onChange: (photos: Photo[]) => void;
  t: T;
  notice: (k: TranslationKey) => void;
}) {
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  async function add(files: FileList | File[] | null, index?: number) {
    if (!files?.length || busy) return;
    setBusy(true);
    const next = [...project.photos];
    try {
      for (const file of [...files]) {
        if (!alive.current) return;
        if (index === undefined && next.length >= 5) {
          notice("photoLimit");
          break;
        }
        try {
          const blob = await compressImage(file);
          if (!alive.current) return;
          const photo = { id: newId(), blob, x: 50, y: 50, zoom: 1 };
          if (index !== undefined) next[index] = photo;
          else next.push(photo);
        } catch (error) {
          const key = (error as Error).message;
          if (alive.current)
            notice(
              ["imageType", "imageSize", "imageDecode"].includes(key)
                ? (key as TranslationKey)
                : "imageDecode",
            );
        }
      }
      if (alive.current) onChange(next);
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  return (
    <>
      <h2>{t("photosHeading")}</h2>
      <p className="hint">{t("photosHint")}</p>
      <div className="row wrap">
        <label className={`upload primary ${busy ? "disabled" : ""}`}>
          <ImagePlus size={20} />
          {t("addPhotos")}
          <input
            type="file"
            multiple
            disabled={busy || project.photos.length === 5}
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              void add(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        <label className="upload secondary">
          <Camera size={20} />
          {t("camera")}
          <input
            type="file"
            capture="environment"
            disabled={busy || project.photos.length === 5}
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              void add(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        <span className="hint">{project.photos.length}/5</span>
      </div>
      {busy && <p role="status">{t("processing")}</p>}
      <p className="hint">{t("cropHint")}</p>
      <fieldset className="photo-grid editor-fields" disabled={busy}>
        {project.photos.map((photo, i) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            index={i}
            count={project.photos.length}
            t={t}
            onChange={(changed) =>
              onChange(project.photos.map((p, j) => (j === i ? changed : p)))
            }
            onRemove={() => onChange(project.photos.filter((_, j) => j !== i))}
            onMove={(delta) => {
              const next = [...project.photos];
              [next[i], next[i + delta]] = [next[i + delta], next[i]];
              onChange(next);
            }}
            onReplace={(file) => {
              void add([file], i);
            }}
          />
        ))}
      </fieldset>
    </>
  );
}
