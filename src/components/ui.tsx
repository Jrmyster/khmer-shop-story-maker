import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import type { TranslationKey } from "../locales/en";
export type T = (key: TranslationKey, index?: number) => string;
export function useBlobUrl(blob: Blob | null) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!blob) {
      setUrl("");
      return;
    }
    const value = URL.createObjectURL(blob);
    setUrl(value);
    return () => URL.revokeObjectURL(value);
  }, [blob]);
  return url;
}
export function Field({
  label,
  value,
  onChange,
  multiline = false,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="field">
      <span>
        {label}
        {required && " *"}
      </span>
      {multiline ? (
        <textarea
          value={value}
          maxLength={1200}
          rows={4}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type={type}
          inputMode={type === "tel" ? "tel" : undefined}
          value={value}
          maxLength={300}
          required={required}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
export function Modal({
  title,
  onClose,
  children,
  t,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  t: T;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-label={title}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button
          type="button"
          className="icon-btn"
          aria-label={t("close")}
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
