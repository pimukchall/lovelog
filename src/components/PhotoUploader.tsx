"use client";
import { useState, useCallback } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import Image from "next/image";

interface UploadResult {
  url: string;
  publicId: string;
}

interface Props {
  onUpload: (result: UploadResult) => void;
  label?: string;
  preview?: string;
}

export default function PhotoUploader({ onUpload, label = "Upload Photo", preview }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [localPreview, setLocalPreview] = useState<string | null>(preview || null);

  const handleFile = useCallback(async (file: File) => {
    setUploading(true);
    setProgress(0);

    // แสดง preview ทันที
    const reader = new FileReader();
    reader.onload = (e) => setLocalPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // simulate progress ระหว่างรอ Cloudinary
    const interval = setInterval(() => {
      setProgress((p) => (p < 85 ? p + 5 : p));
    }, 300);

    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
      onUpload(data);
    } finally {
      clearInterval(interval);
      setUploading(false);
    }
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="relative group"
    >
      <label className="relative flex flex-col items-center justify-center w-full aspect-square rounded-2xl border-2 border-dashed border-purple-500/40 hover:border-purple-400 bg-purple-900/10 cursor-pointer transition-all hover:bg-purple-900/20 overflow-hidden">
        {localPreview ? (
          <Image src={localPreview} alt="preview" fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover rounded-2xl" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-[var(--muted)] group-hover:text-purple-300 transition-colors">
            <Upload size={32} />
            <span className="text-sm">{label}</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-2xl gap-3">
            <Loader2 size={32} className="animate-spin text-purple-400" />
            <div className="w-3/4 bg-white/20 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-white/70">กำลังอัปโหลด {progress}%</span>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </label>
      {localPreview && !uploading && (
        <button
          onClick={() => setLocalPreview(null)}
          className="absolute top-2 right-2 bg-black/60 rounded-full p-1 hover:bg-red-500/60 transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
