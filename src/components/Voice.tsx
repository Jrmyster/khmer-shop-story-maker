import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2 } from "lucide-react";
import type { Project } from "../types";
import { audioMime } from "../lib/capabilities";
import { useBlobUrl, Field, type T } from "./ui";
import type { TranslationKey } from "../locales/en";
import { TRANSCRIPTION_URL, transcriptionProvider } from "../providers";
export function Voice({
  project,
  update,
  t,
  notice,
  confirm,
}: {
  project: Project;
  update: (p: Partial<Project>) => void;
  t: T;
  notice: (k: TranslationKey) => void;
  confirm: (text: string, action: () => void) => void;
}) {
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const url = useBlobUrl(project.voice);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current) clearTimeout(timer.current);
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach((track) => track.stop());
      abort.current?.abort();
    };
  }, []);
  async function record() {
    setBusy(true);
    try {
      if (
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      )
        throw new Error();
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = media;
      const mime = audioMime();
      const r = new MediaRecorder(media, mime ? { mimeType: mime } : undefined);
      recorder.current = r;
      const chunks: Blob[] = [];
      const start = performance.now();
      r.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      r.onstop = () => {
        if (timer.current) clearTimeout(timer.current);
        media.getTracks().forEach((track) => track.stop());
        if (mounted.current) {
          const blob = new Blob(chunks, { type: r.mimeType });
          if (blob.size && blob.size < 8 * 1024 * 1024)
            update({
              voice: blob,
              voiceDuration: Math.min(20, (performance.now() - start) / 1000),
              keepVoice: true,
            });
          else notice("microphoneError");
          setRecording(false);
        }
      };
      r.onerror = () => {
        media.getTracks().forEach((track) => track.stop());
        if (mounted.current) {
          setRecording(false);
          notice("microphoneError");
        }
      };
      r.start(500);
      setRecording(true);
      timer.current = setTimeout(() => {
        if (r.state === "recording") r.stop();
      }, 20000);
    } catch {
      stream.current?.getTracks().forEach((track) => track.stop());
      if (mounted.current) notice("microphoneError");
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  async function transcribe() {
    if (!project.voice) return;
    setBusy(true);
    abort.current = new AbortController();
    try {
      update({
        transcript: await transcriptionProvider.transcribe(
          project.voice,
          abort.current.signal,
        ),
      });
    } catch {
      if (mounted.current) notice("transcriptionError");
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <>
      <h2>{t("voiceHeading")}</h2>
      <div className="row wrap">
        <button
          className={recording ? "secondary" : "primary"}
          disabled={busy}
          onClick={() => (recording ? recorder.current?.stop() : void record())}
        >
          {recording ? <Square size={18} /> : <Mic size={18} />}{" "}
          {t(recording ? "stop" : project.voice ? "recordAgain" : "record")}
        </button>
        {recording && (
          <span role="status" className="recording">
            {t("recording")}
          </span>
        )}
      </div>
      {project.voice && url && (
        <div className="voice-player">
          <audio src={url} controls aria-label={t("voiceSaved")} />
          <button
            className="icon-btn danger"
            aria-label={t("removeVoice")}
            onClick={() => update({ voice: null, voiceDuration: 0 })}
          >
            <Trash2 size={18} />
          </button>
        </div>
      )}
      <label className="check">
        <input
          type="checkbox"
          checked={project.keepVoice}
          onChange={(e) => update({ keepVoice: e.target.checked })}
        />
        {t("keepVoice")}
      </label>
      <Field
        label={t("transcript")}
        value={project.transcript}
        multiline
        onChange={(transcript) => update({ transcript })}
      />
      <p className="hint">{t("transcriptHint")}</p>
      {TRANSCRIPTION_URL ? (
        <button
          className="secondary"
          disabled={busy || !project.voice}
          onClick={() =>
            confirm(t("transcriptionConsent"), () => void transcribe())
          }
        >
          {t("transcribe")}
        </button>
      ) : (
        <p className="hint">{t("transcriptionMissing")}</p>
      )}
      <div className="field-grid">
        <label className="field">
          <span>
            {t("captionSize")} · {project.captionSize}
          </span>
          <input
            type="range"
            min={24}
            max={48}
            value={project.captionSize}
            onChange={(e) => update({ captionSize: Number(e.target.value) })}
          />
        </label>
        <label className="field">
          <span>{t("captionPosition")}</span>
          <select
            value={project.captionPosition}
            onChange={(e) =>
              update({
                captionPosition: e.target.value as Project["captionPosition"],
              })
            }
          >
            <option value="top">{t("top")}</option>
            <option value="bottom">{t("bottom")}</option>
          </select>
        </label>
      </div>
      <p className="hint">{t("timing")}</p>
    </>
  );
}
