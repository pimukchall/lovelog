"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Trash2, X, Loader2, Pencil, Check } from "lucide-react";
import Image from "next/image";
import PhotoUploader from "@/components/PhotoUploader";

interface Photo {
  id: string;
  url: string;
  caption?: string;
  takenAt?: string;
}

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const loadingMoreRef = useRef(false);
  const nextCursorRef = useRef<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [pending, setPending] = useState<{ url: string; publicId: string } | null>(null);
  const [caption, setCaption] = useState("");
  const [takenAt, setTakenAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Photo | null>(null);
  const [editing, setEditing] = useState(false);
  const [editCaption, setEditCaption] = useState("");
  const [editTakenAt, setEditTakenAt] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchPhotos = useCallback(async (id: string, cursor?: string) => {
    const url = `/api/photos?coupleId=${id}${cursor ? `&cursor=${cursor}` : ""}`;
    const res = await fetch(url);
    const data = await res.json();
    return data as { photos: Photo[]; nextCursor: string | null };
  }, []);

  useEffect(() => {
    fetch("/api/couple").then(r => r.json()).then(async d => {
      if (d?.id) {
        setCoupleId(d.id);
        const data = await fetchPhotos(d.id);
        setPhotos(data.photos);
        setNextCursor(data.nextCursor);
        nextCursorRef.current = data.nextCursor;
      }
      setLoading(false);
    });
  }, [fetchPhotos]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !coupleId) return;

    const observer = new IntersectionObserver(async (entries) => {
      if (!entries[0].isIntersecting || loadingMoreRef.current || !nextCursorRef.current) return;
      loadingMoreRef.current = true;
      setLoadingMore(true);
      const data = await fetchPhotos(coupleId, nextCursorRef.current);
      setPhotos(prev => [...prev, ...data.photos]);
      nextCursorRef.current = data.nextCursor;
      setNextCursor(data.nextCursor);
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }, { threshold: 0.1 });

    observer.observe(el);
    return () => observer.disconnect();
  }, [coupleId, fetchPhotos]);

  async function addPhoto(e: React.FormEvent) {
    e.preventDefault();
    if (!coupleId || !pending) return;
    setSaving(true);
    const photo = await fetch("/api/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coupleId, url: pending.url, publicId: pending.publicId, caption, takenAt: takenAt || null }),
    }).then(r => r.json());
    setPhotos(prev => [photo, ...prev]);
    setShowAdd(false);
    setPending(null);
    setCaption("");
    setTakenAt("");
    setSaving(false);
  }

  async function deletePhoto(id: string) {
    await fetch(`/api/photos?id=${id}`, { method: "DELETE" });
    setPhotos(prev => prev.filter(p => p.id !== id));
    setSelected(null);
  }

  function openEdit(photo: Photo) {
    setEditing(true);
    setEditCaption(photo.caption ?? "");
    setEditTakenAt(photo.takenAt ? photo.takenAt.split("T")[0] : "");
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    const updated = await fetch("/api/photos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, caption: editCaption, takenAt: editTakenAt || null }),
    }).then(r => r.json());
    setPhotos(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
    setSelected(prev => prev ? { ...prev, ...updated } : null);
    setEditing(false);
    setSaving(false);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold gradient-text">Gallery</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-sm font-medium hover:opacity-90"
        >
          <Plus size={16} /> เพิ่มรูป
        </button>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={addPhoto} className="glass rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold gradient-text">เพิ่มรูปภาพ</h2>
              <button type="button" onClick={() => setShowAdd(false)}><X size={20} /></button>
            </div>
            <PhotoUploader onUpload={setPending} />
            <input
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="คำบรรยาย (ไม่บังคับ)"
              className="w-full bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-400"
            />
            <input
              type="date"
              value={takenAt}
              onChange={e => setTakenAt(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-400"
            />
            <button
              type="submit"
              disabled={!pending || saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 font-medium hover:opacity-90 disabled:opacity-40"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : "บันทึก"}
            </button>
          </form>
        </div>
      )}

      {/* Lightbox */}
      {selected && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => { setSelected(null); setEditing(false); }}>
          <div className="relative max-w-3xl w-full space-y-3" onClick={e => e.stopPropagation()}>
            <Image src={selected.url} alt={selected.caption || ""} width={900} height={600} className="rounded-2xl object-contain max-h-[70vh] w-full" />

            {/* Edit form */}
            {editing ? (
              <form onSubmit={saveEdit} className="glass rounded-2xl p-4 space-y-3">
                <input
                  value={editCaption}
                  onChange={e => setEditCaption(e.target.value)}
                  placeholder="คำบรรยาย"
                  className="w-full bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-400"
                />
                <input
                  type="date"
                  value={editTakenAt}
                  onChange={e => setEditTakenAt(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-400"
                />
                <div className="flex gap-2">
                  <button type="submit" disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 disabled:opacity-40">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} บันทึก
                  </button>
                  <button type="button" onClick={() => setEditing(false)}
                    className="px-4 py-2 rounded-xl text-sm" style={{ background: "var(--input-bg)", color: "var(--muted)" }}>
                    ยกเลิก
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                {selected.caption && <p className="flex-1 text-center text-sm" style={{ color: "var(--muted)" }}>{selected.caption}</p>}
                {selected.takenAt && <p className="text-xs" style={{ color: "var(--muted-subtle)" }}>{new Date(selected.takenAt).toLocaleDateString("th-TH")}</p>}
              </div>
            )}

            <button onClick={() => { setSelected(null); setEditing(false); }} className="absolute top-2 right-2 bg-black/60 rounded-full p-2 hover:bg-white/10"><X size={20} /></button>
            <button onClick={() => deletePhoto(selected.id)} className="absolute top-2 left-2 bg-black/60 rounded-full p-2 hover:bg-red-500/60"><Trash2 size={20} /></button>
            {!editing && (
              <button onClick={() => openEdit(selected)} className="absolute top-2 left-12 bg-black/60 rounded-full p-2 hover:bg-white/10"><Pencil size={20} /></button>
            )}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {loading && Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-2xl animate-pulse" style={{ background: "var(--input-bg)" }} />
        ))}
        {!loading && photos.map(p => (
          <div
            key={p.id}
            onClick={() => { setSelected(p); setEditing(false); }}
            className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group hover:scale-[1.02] transition-transform"
          >
            <Image src={p.url} alt={p.caption || ""} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
              {p.caption && <p className="text-xs text-white line-clamp-2">{p.caption}</p>}
            </div>
          </div>
        ))}
        {!loading && photos.length === 0 && (
          <div className="col-span-full text-center py-20 text-[var(--muted-subtle)]">
            ยังไม่มีรูป เพิ่มรูปแรกเลย! 📸
          </div>
        )}
      </div>

      <div ref={sentinelRef} className="h-4" />
      {loadingMore && (
        <div className="flex justify-center py-4">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent)" }} />
        </div>
      )}
      {!loading && !nextCursor && photos.length > 0 && (
        <p className="text-center text-xs py-2" style={{ color: "var(--muted)" }}>
          รูปทั้งหมด {photos.length} รูป
        </p>
      )}
    </div>
  );
}
