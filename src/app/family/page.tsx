"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, X, Pencil, Check, Loader2, Heart, Upload } from "lucide-react";
import Image from "next/image";

interface Couple {
  id: string;
  person1Name: string;
  person2Name: string;
  person1PhotoUrl?: string;
  person2PhotoUrl?: string;
}

interface FamilyMember {
  id: string;
  name: string;
  photoUrl?: string;
  order: number;
}

// ── small reusable avatar that lets you click to upload ──────────────────────
function AvatarUpload({
  name,
  photoUrl,
  size = 100,
  onUpload,
  editable = true,
}: {
  name: string;
  photoUrl?: string | null;
  size?: number;
  onUpload?: (url: string, publicId: string) => void;
  editable?: boolean;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (!onUpload) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    onUpload(data.url, data.publicId);
    setUploading(false);
  }

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const inner = (
    <div
      className="relative rounded-full overflow-hidden border-2 border-purple-400/40 bg-purple-900/30 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {photoUrl ? (
        <Image src={photoUrl} alt={name} fill sizes={`${size}px`} className="object-cover" />
      ) : (
        <span className="text-[var(--muted)] font-bold select-none" style={{ fontSize: size * 0.32 }}>
          {initials}
        </span>
      )}
      {uploading && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <Loader2 size={size * 0.3} className="animate-spin text-purple-300" />
        </div>
      )}
      {editable && !uploading && (
        <div className="absolute inset-0 bg-black/0 hover:bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-all">
          <Upload size={size * 0.25} className="text-white" />
        </div>
      )}
    </div>
  );

  if (!editable || !onUpload) return inner;

  return (
    <label className="cursor-pointer">
      {inner}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </label>
  );
}

// ── connector line SVG ────────────────────────────────────────────────────────
function TreeLines({ childCount }: { childCount: number }) {
  if (childCount === 0) return null;
  return (
    <div className="flex flex-col items-center gap-0 pointer-events-none select-none">
      {/* vertical stem down from parents */}
      <div className="w-0.5 h-8 bg-gradient-to-b from-purple-400 to-pink-400" />
      {/* horizontal bar across children */}
      {childCount > 1 && (
        <div className="relative flex items-start justify-center" style={{ width: `${childCount * 120}px` }}>
          <div className="absolute top-0 left-[60px] right-[60px] h-0.5 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400" />
          <div className="flex justify-around w-full">
            {Array.from({ length: childCount }).map((_, i) => (
              <div key={i} className="w-0.5 h-8 bg-gradient-to-b from-pink-400 to-purple-400" />
            ))}
          </div>
        </div>
      )}
      {childCount === 1 && <div className="w-0.5 h-8 bg-gradient-to-b from-pink-400 to-purple-400" />}
    </div>
  );
}

export default function FamilyPage() {
  const [couple, setCouple] = useState<Couple | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  // add child form
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhoto, setNewPhoto] = useState<{ url: string; publicId: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // inline name edit
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const load = useCallback(async () => {
    const c = await fetch("/api/couple").then((r) => r.json());
    if (!c) { setLoading(false); return; }
    setCouple(c);
    const m = await fetch(`/api/family?coupleId=${c.id}`).then((r) => r.json());
    setMembers(m);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function uploadParentPhoto(slot: 1 | 2, url: string, publicId: string) {
    if (!couple) return;
    const body =
      slot === 1
        ? { id: couple.id, person1PhotoUrl: url, person1PublicId: publicId }
        : { id: couple.id, person2PhotoUrl: url, person2PublicId: publicId };
    const updated = await fetch("/api/couple", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => r.json());
    setCouple(updated);
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!couple || !newName.trim()) return;
    setSaving(true);
    const member = await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coupleId: couple.id,
        name: newName.trim(),
        photoUrl: newPhoto?.url ?? null,
        publicId: newPhoto?.publicId ?? null,
      }),
    }).then((r) => r.json());
    setMembers((prev) => [...prev, member]);
    setNewName("");
    setNewPhoto(null);
    setShowAdd(false);
    setSaving(false);
  }

  async function deleteMember(id: string) {
    await fetch(`/api/family?id=${id}`, { method: "DELETE" });
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  async function saveName(id: string) {
    const trimmed = editName.trim();
    if (!trimmed) return;
    const updated = await fetch("/api/family", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: trimmed }),
    }).then((r) => r.json());
    setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));
    setEditId(null);
  }

  async function updateMemberPhoto(id: string, url: string, publicId: string) {
    const updated = await fetch("/api/family", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, photoUrl: url, publicId }),
    }).then((r) => r.json());
    setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Heart size={36} className="animate-pulse text-pink-400" />
      </div>
    );
  }

  if (!couple) {
    return (
      <div className="text-center py-24 text-[var(--muted-subtle)]">
        ตั้งค่าข้อมูลคู่รักก่อนนะ →{" "}
        <a href="/settings" className="underline [var(--accent)]">Settings</a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold gradient-text">🌳 ผังครอบครัว</h1>
        <p className="text-[var(--muted-subtle)] text-sm mt-1">กดที่รูปเพื่อเปลี่ยนรูป · กดชื่อเพื่อแก้ไข</p>
      </div>

      {/* ── Tree ─────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-0 overflow-x-auto pb-4">

        {/* Parents row */}
        <div className="flex items-end gap-10">
          {/* Parent 1 */}
          <div className="flex flex-col items-center gap-2">
            <AvatarUpload
              name={couple.person1Name}
              photoUrl={couple.person1PhotoUrl}
              size={100}
              onUpload={(url, pid) => uploadParentPhoto(1, url, pid)}
            />
            <span className="text-sm font-semibold [var(--foreground)]">{couple.person1Name}</span>
          </div>

          {/* Heart connector */}
          <div className="flex flex-col items-center pb-8 gap-1">
            <Heart size={28} className="text-pink-400 heartbeat-anim fill-pink-400" />
            <div className="w-16 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400" />
          </div>

          {/* Parent 2 */}
          <div className="flex flex-col items-center gap-2">
            <AvatarUpload
              name={couple.person2Name}
              photoUrl={couple.person2PhotoUrl}
              size={100}
              onUpload={(url, pid) => uploadParentPhoto(2, url, pid)}
            />
            <span className="text-sm font-semibold [var(--foreground)]">{couple.person2Name}</span>
          </div>
        </div>

        {/* Connector lines */}
        <TreeLines childCount={members.length} />

        {/* Children row */}
        {members.length > 0 && (
          <div className="flex flex-wrap justify-center gap-6 mt-1">
            {members.map((m) => (
              <div key={m.id} className="flex flex-col items-center gap-2 group relative">
                <AvatarUpload
                  name={m.name}
                  photoUrl={m.photoUrl}
                  size={80}
                  onUpload={(url, pid) => updateMemberPhoto(m.id, url, pid)}
                />

                {/* Delete button */}
                <button
                  onClick={() => deleteMember(m.id)}
                  className="absolute -top-1 -right-1 bg-black/70 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                >
                  <X size={12} />
                </button>

                {/* Name / edit */}
                {editId === m.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveName(m.id)}
                      className="w-24 bg-[var(--input-bg)] border border-purple-400 rounded-lg px-2 py-0.5 text-xs text-center focus:outline-none"
                    />
                    <button onClick={() => saveName(m.id)} className="text-green-400 hover:text-green-300">
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditId(m.id); setEditName(m.name); }}
                    className="flex items-center gap-1 text-xs text-[var(--muted)] hover:text-white transition-colors"
                  >
                    <span className="font-medium">{m.name}</span>
                    <Pencil size={10} className="opacity-0 group-hover:opacity-60" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {members.length === 0 && (
          <div className="mt-6 text-[var(--muted-subtle)] text-sm text-center">
            ยังไม่มีลูก กด "+ เพิ่มลูก" ด้านล่างได้เลย
          </div>
        )}
      </div>

      {/* ── Add child ──────────────────────────────────────────── */}
      {showAdd ? (
        <form onSubmit={addMember} className="glass rounded-2xl p-5 max-w-sm mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold gradient-text">เพิ่มลูก</span>
            <button type="button" onClick={() => setShowAdd(false)}><X size={18} /></button>
          </div>

          {/* Photo preview & upload */}
          <div className="flex justify-center">
            <label className="cursor-pointer">
              <div className="relative w-20 h-20 rounded-full border-2 border-dashed border-pink-400/40 bg-pink-900/10 overflow-hidden flex items-center justify-center hover:border-pink-400 transition-colors group">
                {newPhoto ? (
                  <Image src={newPhoto.url} alt="preview" fill sizes="80px" className="object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-[var(--muted-subtle)] group-hover:text-pink-300 transition-colors">
                    <Upload size={20} />
                    <span className="text-[10px] mt-0.5">ใส่รูป</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const fd = new FormData();
                  fd.append("file", file);
                  const res = await fetch("/api/upload", { method: "POST", body: fd });
                  setNewPhoto(await res.json());
                }}
              />
            </label>
          </div>

          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="ชื่อลูก"
            required
            className="w-full bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-400 text-sm"
          />
          <button
            type="submit"
            disabled={saving || !newName.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-sm font-medium hover:opacity-90 disabled:opacity-40"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Heart size={16} />}
            บันทึก
          </button>
        </form>
      ) : (
        <div className="flex justify-center">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-pink-400/30 hover:border-pink-400 text-pink-300 hover:text-pink-200 transition-all text-sm"
          >
            <Plus size={16} /> เพิ่มลูก
          </button>
        </div>
      )}
    </div>
  );
}
