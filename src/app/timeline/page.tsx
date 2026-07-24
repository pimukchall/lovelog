"use client";
import { useState, useEffect } from "react";
import { Plus, X, Heart, Star, Camera, Loader2 } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import PhotoUploader from "@/components/PhotoUploader";

interface Memory {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: string;
  photos: { id: string; url: string; caption?: string }[];
}

const TYPE_ICONS: Record<string, string> = {
  moment: "💛",
  anniversary: "🎉",
  milestone: "⭐",
};

export default function TimelinePage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", date: "", type: "moment" });
  const [pendingPhoto, setPendingPhoto] = useState<{ url: string; publicId: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/couple").then(r => r.json()).then(d => {
      if (d?.id) {
        setCoupleId(d.id);
        fetch(`/api/memories?coupleId=${d.id}`).then(r => r.json()).then(setMemories);
      }
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
    const memory = await res.json();
    if (pendingPhoto) {
      await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coupleId, memoryId: memory.id, url: pendingPhoto.url, publicId: pendingPhoto.publicId }),
      });
      memory.photos = [{ url: pendingPhoto.url }];
    }
    setMemories(prev => [memory, ...prev]);
    setShowForm(false);
    setForm({ title: "", description: "", date: "", type: "moment" });
    setPendingPhoto(null);
    setSaving(false);
  }

  async function deleteMemory(id: string) {
    await fetch(`/api/memories?id=${id}`, { method: "DELETE" });
    setMemories(prev => prev.filter(m => m.id !== id));
  }

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

      {/* Add form modal */}
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
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Heart size={18} />}
              บันทึก
            </button>
          </form>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 timeline-line" />
        <div className="space-y-8">
          {memories.map((m) => (
            <div key={m.id} className="relative pl-14">
              <div className="absolute left-4 -translate-x-1/2 w-5 h-5 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 border-2 border-[var(--timeline-dot-border)] flex items-center justify-center text-xs z-10">
                {TYPE_ICONS[m.type] || "💛"}
              </div>
              <div className="glass rounded-2xl p-4 space-y-2 group">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs text-[var(--muted-subtle)]">
                      {format(new Date(m.date), "d MMMM yyyy")}
                    </div>
                    <div className="font-semibold text-lg">{m.title}</div>
                  </div>
                  <button
                    onClick={() => deleteMemory(m.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--muted-subtle)] hover:text-red-400"
                  >
                    <X size={16} />
                  </button>
                </div>
                {m.description && <p className="text-[var(--muted)] text-sm">{m.description}</p>}
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
          ))}
          {memories.length === 0 && (
            <div className="text-center text-[var(--muted-subtle)] py-20">
              <Camera size={48} className="mx-auto mb-4 opacity-30" />
              <p>ยังไม่มีความทรงจำ เพิ่มอันแรกเลย!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
