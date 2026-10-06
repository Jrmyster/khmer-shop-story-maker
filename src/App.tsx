import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clapperboard,
  FolderOpen,
  HelpCircle,
  Home,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import type { Business, Language, Project, TemplateId, Tone } from "./types";
import { translate } from "./locales";
import type { TranslationKey } from "./locales/en";
import { newProject, validPrice } from "./lib/project";
import { deleteProject, listProjects, saveProject } from "./lib/storage";
import { compressImage } from "./lib/images";
import { templates } from "./data/templates";
import { AI_URL, aiProvider, configuredUrl, localProvider } from "./providers";
import { Field, Modal, useBlobUrl, type T } from "./components/ui";
import { Photos } from "./components/Photos";
import { Voice } from "./components/Voice";
import { Preview } from "./components/Preview";
import { ExportPanel } from "./components/ExportPanel";
const portal =
  configuredUrl(import.meta.env.VITE_KHMER_ONE_PORTAL_URL) ||
  "https://khmerone.jaredrobertw.workers.dev/";
function initialLanguage(): Language {
  try {
    const lang = localStorage.getItem("shop-story-language");
    if (lang === "en" || lang === "both") return lang;
  } catch {
    /* editing survives restricted storage */
  }
  return "km";
}
function AssetUpload({
  blob,
  onUpload,
  onRemove,
  t,
  kind,
  notice,
}: {
  blob: Blob | null;
  onUpload: (blob: Blob) => void;
  onRemove: () => void;
  t: T;
  kind: "logo" | "khqr";
  notice: (k: TranslationKey) => void;
}) {
  const url = useBlobUrl(blob);
  const [busy, setBusy] = useState(false);
  async function handle(file: File) {
    setBusy(true);
    try {
      onUpload(await compressImage(file, kind === "khqr"));
    } catch (error) {
      const key = (error as Error).message;
      notice(
        ["imageType", "imageSize", "imageDecode"].includes(key)
          ? (key as TranslationKey)
          : "imageDecode",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="asset-upload">
      <h3>{t(kind === "logo" ? "logo" : "khqr")}</h3>
      {blob && url && (
        <img
          src={url}
          className="asset-preview"
          alt={t(kind === "logo" ? "logo" : "khqr")}
        />
      )}
      <div className="row wrap">
        <label className="upload secondary">
          <Upload size={18} />
          {t(kind === "logo" ? "uploadLogo" : "uploadQr")}
          <input
            disabled={busy}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              if (e.target.files?.[0]) void handle(e.target.files[0]);
              e.target.value = "";
            }}
          />
        </label>
        {blob && (
          <button
            className="icon-btn danger"
            aria-label={t(kind === "logo" ? "removeLogo" : "removeQr")}
            onClick={onRemove}
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
      {busy && <p role="status">{t("processing")}</p>}
    </div>
  );
}
function StoryEditor({
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
  const [mode, setMode] = useState<"typed" | "guided">("typed");
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      abort.current?.abort();
    };
  }, []);
  const business = (key: keyof Business, value: string) =>
    update({ business: { ...project.business, [key]: value } });
  async function generate(ai = false) {
    setBusy(true);
    abort.current = new AbortController();
    try {
      const result = await (ai ? aiProvider : localProvider).generate(
        project,
        project.tone,
        abort.current.signal,
      );
      if (mounted.current) update({ copyKm: result.km, copyEn: result.en });
    } catch {
      if (mounted.current) notice("aiError");
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <>
      <h2>{t("storyHeading")}</h2>
      <div className="segmented">
        <button
          aria-pressed={mode === "typed"}
          onClick={() => setMode("typed")}
        >
          {t("typed")}
        </button>
        <button
          aria-pressed={mode === "guided"}
          onClick={() => setMode("guided")}
        >
          {t("guided")}
        </button>
        <button onClick={() => update({ step: 4 })}>{t("recorded")}</button>
      </div>
      <Field
        label={t("description")}
        value={project.business.description}
        multiline
        onChange={(value) => business("description", value)}
      />
      {mode === "guided" && (
        <>
          <Field
            label={t("benefit")}
            value={project.business.benefit}
            multiline
            onChange={(value) => business("benefit", value)}
          />
          <Field
            label={t("order")}
            value={project.business.order}
            onChange={(value) => business("order", value)}
          />
          <p className="hint">
            {t("price")}: {project.business.khr} ៛ / {project.business.usd} USD
          </p>
        </>
      )}
      <div className="field-grid">
        <label className="field">
          <span>{t("tone")}</span>
          <select
            value={project.tone}
            onChange={(e) => update({ tone: e.target.value as Tone })}
          >
            {(["short", "friendly", "urgent", "informative"] as const).map(
              (tone, i) => (
                <option value={tone} key={tone}>
                  {t("tones", i)}
                </option>
              ),
            )}
          </select>
        </label>
        <label className="field">
          <span>{t("outputLanguage")}</span>
          <select
            value={project.outputLanguage}
            onChange={(e) =>
              update({ outputLanguage: e.target.value as Language })
            }
          >
            {(["km", "en", "both"] as const).map((lang) => (
              <option key={lang} value={lang}>
                {t(lang)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="hint">{t("copyHint")}</p>
      <div className="row wrap">
        <button
          className="primary"
          disabled={busy}
          onClick={() => void generate()}
        >
          <Sparkles size={18} />
          {t(busy ? "aiWorking" : "generate")}
        </button>
        {AI_URL && (
          <button
            className="secondary"
            disabled={busy}
            onClick={() => confirm(t("aiConsent"), () => void generate(true))}
          >
            {t("ai")}
          </button>
        )}
      </div>
      {!AI_URL && <p className="hint">{t("aiMissing")}</p>}
      <div className="copy-fields">
        {project.outputLanguage !== "en" && (
          <Field
            label={t("copyKm")}
            value={project.copyKm}
            multiline
            onChange={(copyKm) => update({ copyKm })}
          />
        )}{" "}
        {project.outputLanguage !== "km" && (
          <Field
            label={t("copyEn")}
            value={project.copyEn}
            multiline
            onChange={(copyEn) => update({ copyEn })}
          />
        )}
      </div>
      <p className="hint">{t("storyHint")}</p>
    </>
  );
}
export default function App() {
  const [lang, setLang] = useState<Language>(initialLanguage);
  const [project, setProject] = useState<Project>(newProject);
  const [loaded, setLoaded] = useState(false);
  const [history, setHistory] = useState<Project[]>([]);
  const [saving, setSaving] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [message, setMessage] = useState<TranslationKey | null>(null);
  const [modal, setModal] = useState<"help" | "history" | null>(null);
  const [confirmation, setConfirmation] = useState<{
    text: string;
    action: () => void;
    label: TranslationKey;
  } | null>(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [showPreview, setShowPreview] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const active = useRef(project);
  const writeQueue = useRef<Promise<void>>(Promise.resolve());
  const t: T = useCallback((key, index) => translate(lang, key, index), [lang]);
  const update = (patch: Partial<Project>) =>
    setProject((p) => ({ ...p, ...patch, updatedAt: Date.now() }));
  useEffect(() => {
    document.documentElement.lang = lang === "both" ? "km" : lang;
    try {
      localStorage.setItem("shop-story-language", lang);
    } catch {
      /* no account needed */
    }
  }, [lang]);
  useEffect(() => {
    let alive = true;
    listProjects()
      .then((items) => {
        if (!alive) return;
        setHistory(items);
        if (items[0]) setProject(items[0]);
      })
      .catch(() => {
        if (alive) setStorageError(true);
      })
      .finally(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);
  const persist = useCallback((p: Project) => {
    setSaving(true);
    const queued = writeQueue.current
      .catch(() => {})
      .then(() => saveProject(p));
    writeQueue.current = queued;
    return queued
      .then(() => {
        setStorageError(false);
        setHistory((items) =>
          [p, ...items.filter((item) => item.id !== p.id)].sort(
            (a, b) => b.updatedAt - a.updatedAt,
          ),
        );
      })
      .catch(() => setStorageError(true))
      .finally(() => setSaving(false));
  }, []);
  useEffect(() => {
    active.current = project;
    if (!loaded) return;
    const timer = setTimeout(() => void persist(project), 650);
    return () => clearTimeout(timer);
  }, [project, loaded, persist]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden && loaded) void persist(active.current);
    };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, [loaded, persist]);
  useEffect(() => {
    const change = () => setOnline(navigator.onLine);
    window.addEventListener("online", change);
    window.addEventListener("offline", change);
    return () => {
      window.removeEventListener("online", change);
      window.removeEventListener("offline", change);
    };
  }, []);
  const confirm = (
    text: string,
    action: () => void,
    label: TranslationKey = "continue",
  ) => setConfirmation({ text, action, label });
  const business = (key: keyof Business, value: string) =>
    update({ business: { ...project.business, [key]: value } });
  const navigate = (step: number) => {
    update({ step });
    setShowPreview(false);
    panel.current?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
  };
  async function switchProject(p: Project) {
    await persist(active.current);
    setProject(p);
    setModal(null);
    setShowPreview(false);
    setMessage(null);
  }
  async function remove(p: Project) {
    if (p.id === active.current.id) setProject(newProject());
    await writeQueue.current.catch(() => {});
    try {
      await deleteProject(p.id);
      setHistory((items) => items.filter((item) => item.id !== p.id));
    } catch {
      setMessage("saveFailed");
    }
  }
  return (
    <>
      <header className="topbar">
        <a href="#main" className="brand">
          <span className="brand-mark">
            <Clapperboard size={24} />
          </span>
          <span>
            <strong>{t("app")}</strong>
            <small>{t("fullName")}</small>
          </span>
        </a>
        <nav aria-label={t("help")}>
          <a
            className="icon-btn portal-link"
            href={portal}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("portal")}
            title={t("portal")}
          >
            <Home size={20} />
          </a>
          <button
            className="icon-btn"
            aria-label={t("history")}
            title={t("history")}
            onClick={() => setModal("history")}
          >
            <FolderOpen size={20} />
          </button>
          <button
            className="icon-btn"
            aria-label={t("help")}
            title={t("help")}
            onClick={() => setModal("help")}
          >
            <HelpCircle size={20} />
          </button>
          <label className="lang-control">
            <span className="sr-only">{t("interfaceLanguage")}</span>
            <select
              aria-label="Interface language / ភាសា"
              value={lang}
              onChange={(e) => setLang(e.target.value as Language)}
            >
              <option value="km">KM</option>
              <option value="en">EN</option>
              <option value="both">KM + EN</option>
            </select>
          </label>
        </nav>
      </header>
      <main id="main">
        <section className="intro">
          <div>
            <div className="eyebrow">
              <span className="sun" />
              KHMER ONE · SHOP STORY
            </div>
            <h1>{t("tagline")}</h1>
            <p>{t("fullName")}</p>
          </div>
          <div className="local-badge">
            <ShieldCheck size={18} />
            {t(online ? "online" : "offline")}
          </div>
        </section>
        <div className="progress-track">
          <div className="progress-text">
            <strong>
              {t("step")} {project.step + 1} {t("of")} 7
            </strong>
            <span role="status">
              {t(
                storageError
                  ? "saveFailed"
                  : saving || !loaded
                    ? "saving"
                    : "saved",
              )}
            </span>
          </div>
          <nav className="steps" aria-label={t("steps", project.step)}>
            {Array.from({ length: 7 }, (_, i) => (
              <button
                key={i}
                aria-label={t("steps", i)}
                aria-current={i === project.step ? "step" : undefined}
                onClick={() => navigate(i)}
              >
                <span>{i < project.step ? <Check size={14} /> : i + 1}</span>
                <small>{t("steps", i)}</small>
              </button>
            ))}
          </nav>
        </div>
        {message && (
          <div className="notice alert" role="alert">
            {t(message)}
            <button className="text-btn" onClick={() => setMessage(null)}>
              {t("close")}
            </button>
          </div>
        )}
        <div className="editor-layout">
          <section
            className="editor"
            ref={panel}
            aria-label={t("steps", project.step)}
            aria-busy={!loaded}
          >
            <fieldset className="editor-fields" disabled={!loaded}>
              {project.step === 0 && (
                <>
                  <h2>{t("steps", 0)}</h2>
                  <p className="hint">{t("businessHint")}</p>
                  <div className="field-grid">
                    <Field
                      label={t("shop")}
                      required
                      value={project.business.shop}
                      onChange={(v) => business("shop", v)}
                    />
                    <Field
                      label={t("product")}
                      required
                      value={project.business.product}
                      onChange={(v) => business("product", v)}
                    />
                    <label className="field">
                      <span>{t("category")}</span>
                      <select
                        value={project.business.category}
                        onChange={(e) => business("category", e.target.value)}
                      >
                        {[
                          "food",
                          "craft",
                          "beauty",
                          "tutoring",
                          "repair",
                          "homestay",
                          "other",
                        ].map((category, i) => (
                          <option value={category} key={category}>
                            {t("categories", i)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>{t("currency")}</span>
                      <select
                        value={project.business.currency}
                        onChange={(e) => business("currency", e.target.value)}
                      >
                        <option value="KHR">{t("khr")}</option>
                        <option value="USD">{t("usd")}</option>
                        <option value="both">{t("bothCurrency")}</option>
                      </select>
                    </label>
                    {project.business.currency !== "USD" && (
                      <Field
                        label={t("khr")}
                        value={project.business.khr}
                        onChange={(v) => business("khr", v)}
                      />
                    )}{" "}
                    {project.business.currency !== "KHR" && (
                      <Field
                        label={t("usd")}
                        value={project.business.usd}
                        onChange={(v) => business("usd", v)}
                      />
                    )}
                  </div>
                  {((project.business.currency !== "USD" &&
                    !validPrice(project.business.khr)) ||
                    (project.business.currency !== "KHR" &&
                      !validPrice(project.business.usd))) && (
                    <p role="alert" className="error">
                      {t("priceError")}
                    </p>
                  )}
                  <div className="field-grid">
                    <Field
                      label={t("phone")}
                      type="tel"
                      value={project.business.phone}
                      onChange={(v) => business("phone", v)}
                    />
                    <Field
                      label={t("telegram")}
                      value={project.business.telegram}
                      onChange={(v) => business("telegram", v)}
                    />
                    <Field
                      label={t("facebook")}
                      value={project.business.facebook}
                      onChange={(v) => business("facebook", v)}
                    />
                    <Field
                      label={t("location")}
                      value={project.business.location}
                      onChange={(v) => business("location", v)}
                    />
                  </div>
                  <Field
                    label={t("taglineField")}
                    value={project.business.tagline}
                    onChange={(v) => business("tagline", v)}
                  />
                </>
              )}
              {project.step === 1 && (
                <Photos
                  key={project.id}
                  project={project}
                  onChange={(photos) => update({ photos })}
                  t={t}
                  notice={setMessage}
                />
              )}
              {project.step === 2 && (
                <StoryEditor
                  key={project.id}
                  project={project}
                  update={update}
                  t={t}
                  notice={setMessage}
                  confirm={confirm}
                />
              )}
              {project.step === 3 && (
                <>
                  <h2>{t("lookHeading")}</h2>
                  <div className="template-grid">
                    {(Object.keys(templates) as TemplateId[]).map((id, i) => {
                      const colors = templates[id];
                      return (
                        <button
                          className="template"
                          key={id}
                          aria-label={t("templates", i)}
                          aria-pressed={project.template === id}
                          onClick={() => update({ template: id })}
                        >
                          <span
                            className="template-art"
                            style={{
                              background: colors.background,
                              color: colors.text,
                            }}
                          >
                            <span style={{ background: colors.surface }}>
                              Aa <i style={{ background: colors.accent }} />
                            </span>
                            <span
                              className="template-price"
                              style={{ color: colors.accent }}
                            >
                              ៛ · $
                            </span>
                          </span>
                          <strong>{t("templates", i)}</strong>
                          {project.template === id && <Check size={16} />}
                        </button>
                      );
                    })}
                  </div>
                  <AssetUpload
                    blob={project.logo}
                    kind="logo"
                    t={t}
                    notice={setMessage}
                    onUpload={(logo) => update({ logo })}
                    onRemove={() => update({ logo: null })}
                  />
                </>
              )}
              {project.step === 4 && (
                <Voice
                  key={project.id}
                  project={project}
                  update={update}
                  t={t}
                  notice={setMessage}
                  confirm={confirm}
                />
              )}
              {project.step === 5 && (
                <>
                  <h2>{t("orderHeading")}</h2>
                  <label className="field">
                    <span>{t("cta")}</span>
                    <select
                      value={project.cta}
                      onChange={(e) =>
                        update({ cta: e.target.value as Project["cta"] })
                      }
                    >
                      {(["order", "telegram", "call", "scan"] as const).map(
                        (cta, i) => (
                          <option key={cta} value={cta}>
                            {t("ctas", i)}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                  <AssetUpload
                    blob={project.khqr}
                    kind="khqr"
                    t={t}
                    notice={setMessage}
                    onUpload={(khqr) => update({ khqr })}
                    onRemove={() => update({ khqr: null })}
                  />
                  <p className="notice">{t("qrNotice")}</p>
                  <p className="hint">{t("qrWarning")}</p>
                </>
              )}
              {project.step === 6 && (
                <ExportPanel
                  key={project.id}
                  project={project}
                  update={update}
                  t={t}
                  notice={setMessage}
                />
              )}
            </fieldset>
          </section>
          <aside
            className={showPreview ? "preview-wrap visible" : "preview-wrap"}
          >
            <Preview key={project.id} project={project} t={t} />
          </aside>
        </div>
        <footer className="page-footer">
          <a href={portal} target="_blank" rel="noopener noreferrer">
            <ArrowLeft size={16} />
            {t("portal")}
          </a>
          <button className="text-btn" onClick={() => setModal("help")}>
            {t("help")}
          </button>
        </footer>
      </main>
      <div className="actionbar">
        <button
          className="secondary"
          disabled={project.step === 0}
          onClick={() => navigate(project.step - 1)}
        >
          <ArrowLeft size={18} />
          <span>{t("back")}</span>
        </button>
        <button
          className="preview-toggle secondary"
          aria-pressed={showPreview}
          onClick={() => setShowPreview((v) => !v)}
        >
          {t("preview")}
        </button>
        {project.step < 6 ? (
          <button
            className="primary"
            onClick={() => navigate(project.step + 1)}
          >
            <span>{t("continue")}</span>
            <ArrowRight size={18} />
          </button>
        ) : (
          <button className="primary" onClick={() => void persist(project)}>
            <Check size={18} />
            {t("saveNow")}
          </button>
        )}
      </div>
      {modal === "help" && (
        <Modal title={t("privacyHeading")} t={t} onClose={() => setModal(null)}>
          <div className="help-copy">
            <p>{t("privacyLocal")}</p>
            <p>{t("privacyAi")}</p>
            <p>{t("privacyClaims")}</p>
            <p>{t("privacyExport")}</p>
            <h3>{t("install")}</h3>
            <p>{t("installHelp")}</p>
            <p>{t("autosaveHelp")}</p>
            <p className="notice">{t("qrNotice")}</p>
          </div>
        </Modal>
      )}
      {modal === "history" && (
        <Modal title={t("history")} t={t} onClose={() => setModal(null)}>
          <button
            className="primary"
            onClick={() => void switchProject(newProject())}
          >
            <Plus size={18} />
            {t("newProject")}
          </button>
          <div className="history-list">
            {!history.length && <p>{t("emptyHistory")}</p>}
            {history.map((p) => (
              <article key={p.id}>
                <div>
                  <strong>{p.business.shop || t("untitled")}</strong>
                  <p>{p.business.product}</p>
                  <small>
                    {new Date(p.updatedAt).toLocaleDateString(
                      lang === "en" ? "en" : "km",
                    )}{" "}
                    · {p.photos.length} {t("photoCount")}
                  </small>
                </div>
                <div className="row">
                  <button
                    className="icon-btn"
                    aria-label={`${t("open")} ${p.business.shop}`}
                    onClick={() => void switchProject(p)}
                  >
                    <ChevronRight size={20} />
                  </button>
                  <button
                    className="icon-btn danger"
                    aria-label={`${t("delete")} ${p.business.shop}`}
                    onClick={() =>
                      confirm(
                        t("deleteConfirm"),
                        () => void remove(p),
                        "confirmDelete",
                      )
                    }
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </Modal>
      )}
      {confirmation && (
        <Modal
          title={t("confirmAction")}
          t={t}
          onClose={() => setConfirmation(null)}
        >
          <p>{confirmation.text}</p>
          <div className="row wrap">
            <button className="secondary" onClick={() => setConfirmation(null)}>
              {t("cancel")}
            </button>
            <button
              className="primary"
              onClick={() => {
                confirmation.action();
                setConfirmation(null);
              }}
            >
              {t(confirmation.label)}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
