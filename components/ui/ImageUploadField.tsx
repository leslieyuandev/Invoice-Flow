"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ImageUploadFieldProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  className?: string;
  previewHeight?: string;
}

export function ImageUploadField({
  value,
  onChange,
  label,
  className,
  previewHeight = "h-32",
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/upload/image", { method: "POST", body: fd });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onChange(data.url ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={className}>
      {label && <p className="text-sm font-medium text-surface-700 mb-1.5">{label}</p>}
      {value ? (
        <div className={cn("relative w-full rounded-lg overflow-hidden border border-surface-200 group", previewHeight)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Uploaded" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-2 left-2 text-xs bg-black/60 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
          >
            Replace
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "w-full rounded-lg border-2 border-dashed border-surface-200 hover:border-brand-400 flex flex-col items-center justify-center gap-1.5 text-surface-400 hover:text-brand-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
            previewHeight
          )}
        >
          {uploading ? (
            <span className="text-xs">Uploading…</span>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              <span className="text-xs font-medium">Upload PNG / JPEG</span>
              <span className="text-xs text-surface-300">Max 5 MB</span>
            </>
          )}
        </button>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
