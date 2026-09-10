"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ImagePlus, LoaderCircle, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImagePreview } from "@/components/ui/image-preview";
import { IMAGE_ACCEPT, imageFileError } from "@/lib/validation";

export function ImageUpload({ disabled = false, onChange, name, label = "รูปหลักฐาน", current = "", required = false }: {
  disabled?: boolean;
  onChange?: (file: File | null) => void;
  name?: string;
  label?: string;
  current?: string | null;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const [selection, setSelection] = useState<{ file: File; url: string } | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form || !name) return;
    const appendFile = (event: FormDataEvent) => {
      if (selection) event.formData.set(name, selection.file);
    };
    form.addEventListener("formdata", appendFile);
    return () => form.removeEventListener("formdata", appendFile);
  }, [name, selection]);

  useEffect(() => {
    const url = selection?.url;
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [selection?.url]);

  function select(file?: File) {
    if (disabled || !file) return;
    const validationError = imageFileError(file);
    if (validationError) {
      setSelection(null);
      if (inputRef.current) inputRef.current.value = "";
      onChange?.(null);
      setError(validationError);
      return;
    }
    setError("");
    if (inputRef.current) {
      const transfer = new DataTransfer();
      transfer.items.add(file);
      inputRef.current.files = transfer.files;
    }
    setSelection({ file, url: URL.createObjectURL(file) });
    onChange?.(file);
  }

  return (
    <div
      className={`mt-4 rounded-2xl outline-offset-4 focus-within:ring-2 focus-within:ring-jade/50 ${dragging ? "ring-2 ring-jade" : ""}`}
      tabIndex={disabled ? -1 : 0}
      role="group" aria-label={label} aria-describedby={`${id}-help`}
      onPaste={(event) => {
        if (disabled) return;
        const files = Array.from(event.clipboardData.items).filter((item) => item.kind === "file").map((item) => item.getAsFile()).filter((file): file is File => file !== null);
        if (!files.length) return;
        event.preventDefault();
        if (files.length !== 1) { setError("เลือกได้ครั้งละ 1 รูปต่อช่อง"); return; }
        select(files[0]);
      }}
      onDragOver={(event) => { event.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
      onDrop={(event) => {
        event.preventDefault(); setDragging(false);
        if (disabled) return;
        if (event.dataTransfer.files.length !== 1) { setError("เลือกได้ครั้งละ 1 รูปต่อช่อง"); return; }
        select(event.dataTransfer.files[0]);
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{label}{required ? " *" : ""}</p>
        <span className="text-xs text-mute">1 รูป / ไม่เกิน 6 MB</span>
      </div>
      <input
        ref={inputRef} name={name} type="file" accept={IMAGE_ACCEPT} required={required && !current} disabled={disabled} className="hidden"
        aria-label={`เลือก${label}`} aria-describedby={`${id}-help`}
        onChange={(event) => { select(event.target.files?.[0]); }}
      />
      {selection ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-canvas p-3">
          <ImagePreview src={selection.url} alt={`ตัวอย่าง${label}ก่อนบันทึก`} className="h-48 w-full sm:h-64" />
          <div className="mt-3 flex min-w-0 items-center gap-2">
            <Check className="h-4 w-4 shrink-0 text-jade" aria-hidden />
            <p className="min-w-0 truncate text-sm" title={selection.file.name}>{selection.file.name}</p>
            <span className="ml-auto shrink-0 text-xs text-mute">{(selection.file.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" tone="ghost" size="sm" disabled={disabled} onClick={() => inputRef.current?.click()} icon={<RefreshCw className="h-4 w-4" aria-hidden />}>เปลี่ยนรูป</Button>
            <Button type="button" tone="danger-ghost" size="sm" disabled={disabled} onClick={() => { setSelection(null); setError(""); if (inputRef.current) inputRef.current.value = ""; onChange?.(null); }} icon={<Trash2 className="h-4 w-4" aria-hidden />}>ยกเลิกรูปที่เลือก</Button>
          </div>
        </div>
      ) : (
        <button
          type="button" disabled={disabled} aria-describedby={`${id}-help`}
          onClick={() => inputRef.current?.click()}
          className={`flex min-h-44 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 py-6 transition disabled:opacity-50 ${dragging ? "border-jade bg-jade/15" : "border-border bg-canvas hover:border-jade hover:bg-jade/5"}`}
        >
          {current ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current} alt={`${label}ปัจจุบัน`} className="h-24 max-w-full rounded-xl object-contain" />
          ) : <span className="rounded-2xl bg-jade/10 p-3 text-jade"><ImagePlus className="h-7 w-7" aria-hidden /></span>}
          <span className="text-sm font-semibold">{current ? "เปลี่ยน" : "เลือก"}{label}</span>
          <span className="text-xs text-mute">ลากรูปมาวาง หรือเลือกช่องนี้แล้วกด Ctrl+V / ⌘V</span>
        </button>
      )}
      <p id={`${id}-help`} className="mt-2 text-xs text-mute">JPG, PNG, WEBP, GIF · วางรูปที่คัดลอกมาในช่องนี้ · แตะรูปตัวอย่างเพื่อขยาย</p>
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
      {disabled && selection && <p role="status" className="mt-3 flex items-center gap-2 text-sm text-jade"><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />กำลังอัปโหลดรูป กรุณารอสักครู่</p>}
    </div>
  );
}
