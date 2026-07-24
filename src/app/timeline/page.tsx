"use client";
import { useState, useEffect } from "react";
import { Plus, X, Camera, Loader2, BookOpen } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import Image from "next/image";
import PhotoUploader from "@/components/PhotoUploader";
import { useSession } from "next-auth/react";

interface Memory {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: string;
  photos: { id: string; url: string; caption?: string }[];
}

interface Post {
  id: string;
  authorId: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
}

type TimelineItem =
  | { kind: "memory"; data: Memory }
  | { kind: "post"; data: Post };

const TYPE_ICONS: Record<string, string> = {
  moment: "💛",
  anniversary: "🎉",
  milestone: "⭐",
};

export default function TimelinePage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", date: "", type: "moment" });
  const [pendingPhoto, setPendingPhoto] = useState<{ url: string; publicId: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/couple").then(r => r.json()).then(async d => {
      if (d?.id) {
        setCoupleId(d.id);
        const [memoriesRes, postsRes] = await Promise.all([
          fetch(`/api/memories?coupleId=${d.id}`).then(r => r.json()),
          fetch("/api/posts").then(r => r.json()),
        ]);

        const memories: TimelineItem[] = (memoriesRes as Memory[]).map(m => ({ kind: "memory", data: m }));
        const posts: TimelineItem[] = (Array.isArray(postsRes) ? postsRes as Post[] : []).map(p => ({ kind: "post", data: p }));

        // merge and sort by date desc
        const merged = [...memories, ...posts].sort((a, b) => {
          const aDate = a.kind === "memory" ? new Date(a.data.date) : new Date(a.data.createdAt);
          const bDate = b.kind === "memory" ? new Date(b.data.date) : new Date(b.data.createdAt);
          return bDate.getTime() - aDate.getTime();
        });

        setItems(merged);
      }
      setLoading(false);
    });
  }, []);

  async function addMemory(e: React.FormEvent) {
    e.preventDefault();
    if (!coupleId) return;
    setSaving(true);
    const res = await fetch("/api/memories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, coupleId }),
    });
    const memory: Memory = await res.json();
    if (pendingPhoto) {
      await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coupleId, memoryId: memory.id, url: pendingPhoto.url, publicId: pendingPhoto.publicId }),
      });
      memory.photos = [{ id: "", url: pendingPhoto.url }];
    }
    setItems(prev => ([{ kind: "memory" as const, data: memory }, ...prev].sort((a, b) => {
      const aDate = a.kind === "memory" ? new Date(a.data.date) : new Date(a.data.createdAt);
      const bDate = b.kind === "memory" ? new Date(b.data.date) : new Date(b.data.createdAt);
      return bDate.getTime() - aDate.getTime();
    })));
    setShowForm(false);
    setForm({ title: "", description: "", date: "", type: "moment" });
    setPendingPhoto(null);
    setSaving(false);
  }

  async function deleteMemory(id: string) {
    await fetch(`/api/memories?id=${id}`, { method: "DELETE" });
    setItems(prev => prev.filter(i => !(i.kind === "memory" && i.data.id === id)));
  }

  async function deletePost(id: string) {
    await fetch(`/api/posts?id=${id}`, { method: "DELETE" });
    setItems(prev => prev.filter(i => !(i.kind === "post" && i.data.id === id)));
  }

  const myId = session?.user?.id;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold gradient-text">Timeline</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> เพิ่มความทรงจำ
        </button>
      </div>

      {/* Add memory modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <form onSubmit={addMemory} onClick={e => e.stopPropagation()} className="glass rounded-2xl p-5 w-full max-w-md space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg gradient-text">เพิ่มความทรงจำ</h2>
              <button type="button" onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="ชื่อเรื่อง"
              required
              className="w-full bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-400"
            />
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="เล่าเรื่องราว..."
              rows={3}
              className="w-full bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-400 resize-none"
            />
            <input
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              required
              className="w-full bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-400"
            />
            <select
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
              className="w-full bg-[var(--select-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-400"
            >
              <option value="moment">💛 ช่วงเวลา</option>
              <option value="anniversary">🎉 ครบรอบ</option>
              <option value="milestone">⭐ Milestone</option>
            </select>
            <PhotoUploader label="เพิ่มรูป (ไม่บังคับ)" onUpload={setPendingPhoto} />
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 font-medium hover:opacity-90 disabled:opacity-50"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : null}
              บันทึก
            </button>
          </form>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 timeline-line" />
        <div className="space-y-8">
          {loading && Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="relative pl-14 animate-pulse">
              <div className="absolute left-4 -translate-x-1/2 w-5 h-5 rounded-full" style={{ background: "var(--input-bg)" }} />
              <div className="rounded-2xl p-4 space-y-3" style={{ background: "var(--input-bg)" }}>
                <div className="h-3 w-24 rounded-full" style={{ background: "var(--glass-border)" }} />
                <div className="h-5 w-48 rounded-full" style={{ background: "var(--glass-border)" }} />
                <div className="h-3 w-full rounded-full" style={{ background: "var(--glass-border)" }} />
              </div>
            </div>
          ))}

          {!loading && items.map(item => {
            if (item.kind === "memory") {
              const m = item.data;
              return (
                <div key={`m-${m.id}`} className="relative pl-14">
                  <div className="absolute left-4 -translate-x-1/2 w-5 h-5 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 border-2 border-[var(--timeline-dot-border)] flex items-center justify-center text-xs z-10">
                    {TYPE_ICONS[m.type] || "💛"}
                  </div>
                  <div className="glass rounded-2xl p-4 space-y-2 group">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs" style={{ color: "var(--muted-subtle)" }}>
                          {format(new Date(m.date), "d MMMM yyyy")}
                        </div>
                        <div className="font-semibold text-lg">{m.title}</div>
                      </div>
                      <button onClick={() => deleteMemory(m.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
                        style={{ color: "var(--muted-subtle)" }}>
                        <X size={16} />
                      </button>
                    </div>
                    {m.description && <p className="text-sm" style={{ color: "var(--muted)" }}>{m.description}</p>}
                    {m.photos?.length > 0 && (
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {m.photos.map((p, i) => (
                          <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                            <Image src={p.url} alt="" fill sizes="(max-width: 768px) 33vw, 150px" className="object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            const p = item.data;
            return (
              <div key={`p-${p.id}`} className="relative pl-14">
                <div className="absolute left-4 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-[var(--timeline-dot-border)] flex items-center justify-center z-10"
                  style={{ background: "var(--input-bg)" }}>
                  <BookOpen size={10} style={{ color: "var(--muted)" }} />
                </div>
                <div className="glass rounded-2xl p-4 space-y-2 group">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs" style={{ color: "var(--muted-subtle)" }}>
                      {p.authorId === myId ? "คุณ" : "คนรัก"} · {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true, locale: th })}
                    </span>
                    {p.authorId === myId && (
                      <button onClick={() => deletePost(p.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
                        style={{ color: "var(--muted-subtle)" }}>
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--foreground)" }}>{p.content}</p>
                  {p.imageUrl && (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden mt-2">
                      <Image src={p.imageUrl} alt="" fill sizes="(max-width: 768px) 100vw, 560px" className="object-cover" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {!loading && items.length === 0 && (
            <div className="text-center py-20" style={{ color: "var(--muted-subtle)" }}>
              <Camera size={48} className="mx-auto mb-4 opacity-30" />
              <p>ยังไม่มีเรื่องราว เพิ่มอันแรกเลย!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
