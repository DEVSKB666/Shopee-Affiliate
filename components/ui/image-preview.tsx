"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, ImageOff, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/cn";

function PreviewImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <span className={cn("flex flex-col items-center justify-center gap-2 bg-canvas text-xs text-mute", className)}>
      <ImageOff className="h-6 w-6" aria-hidden />
      โหลดรูปไม่สำเร็จ
    </span>
  ) : (
    // Uploaded images can come from local storage, Blob, or an object URL.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={className} />
  );
}

export function ImagePreview({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialogRef.current?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`ขยายรูป: ${alt}`}
        className={cn("group relative block shrink-0 overflow-hidden rounded-2xl border border-border bg-canvas", className)}
      >
        <PreviewImage key={src} src={src} alt={alt} className="h-full w-full object-contain" />
        <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/70 p-1.5 text-white transition group-hover:bg-flame">
          <ZoomIn className="h-4 w-4" aria-hidden />
        </span>
      </button>
      {open && createPortal(
        <dialog
          ref={dialogRef}
          aria-labelledby={titleId}
          onClose={() => setOpen(false)}
          onClick={(event) => {
            if (event.target === event.currentTarget) dialogRef.current?.close();
          }}
          className="fixed inset-0 m-auto max-h-[95dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-3xl border border-border bg-paper-2 p-0 text-ink shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-sm"
        >
          <div className="p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id={titleId} className="min-w-0 break-words text-sm font-semibold">{alt}</h2>
              <button type="button" aria-label="ปิดรูปภาพ" onClick={() => dialogRef.current?.close()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mist hover:bg-flame">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <PreviewImage key={src} src={src} alt={alt} className="max-h-[70dvh] min-h-32 w-full rounded-xl bg-canvas object-contain" />
            <a href={src} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm text-jade">
              <ExternalLink className="h-4 w-4" aria-hidden /> เปิดรูปต้นฉบับ
            </a>
          </div>
        </dialog>,
        document.body,
      )}
    </>
  );
}
