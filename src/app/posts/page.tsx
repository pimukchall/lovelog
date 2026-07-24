"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, X, Loader2, BookOpen } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import PhotoUploader from "@/components/PhotoUploader";

interface Post {
  id: string;
  authorId: string;
  content: string;
  imageUrl?: string;
  publicId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function PostsPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [pending, setPending] = useState<{ url: string; publicId: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editPending, setEditPending] = useState<{ url: string; publicId: string } | null>(null);
  const [editRemoveImage, setEditRemoveImage] = useState(false);

  useEffect(() => {
    fetch("/api/posts").then(r => r.json()).then(data => {
      setPosts(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  async function createPost(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, imageUrl: pending?.url, publicId: pending?.publicId }),
    });
    const post = await res.json();
    setPosts(prev => [post, ...prev]);
    setContent("");
    setPending(null);
    setShowForm(false);
    setSaving(false);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    const imageUrl = editRemoveImage ? null : (editPending?.url ?? editing.imageUrl ?? null);
    const publicId = editRemoveImage ? null : (editPending?.publicId ?? editing.publicId ?? null);
    const res = await fetch("/api/posts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editing.id, content: editContent, imageUrl, publicId }),
    });
    const updated = await res.json();
    setPosts(prev => prev.map(p => p.id === updated.id ? updated : p));
    setEditing(null);
    setEditPending(null);
    setEditRemoveImage(false);
    setSaving(false);
  }

  async function deletePost(id: string) {
    await fetch(`/api/posts?id=${id}`, { method: "DELETE" });
    setPosts(prev => prev.filter(p => p.id !== id));
  }

  function startEdit(post: Post) {
    setEditing(post);
    setEditContent(post.content);
    setEditPending(null);
    setEditRemoveImage(false);
  }

  const myId = session?.user?.id;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold gradient-text">โพสต์</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> เขียนโพสต์
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={createPost} className="glass rounded-2xl p-5 space-y-3">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="เขียนอะไรสักอย่าง..."
            rows={4}
            required
            autoFocus
            className="w-full bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-400 resize-none"
          />
          <PhotoUploader label="เพิ่มรูป (ไม่บังคับ)" onUpload={setPending} preview={pending?.url} />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setShowForm(false); setContent(""); setPending(null); }}
              className="px-4 py-2 rounded-xl text-sm" style={{ background: "var(--input-bg)", color: "var(--muted)" }}>
              ยกเลิก
            </button>
            <button type="submit" disabled={!content.trim() || saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 disabled:opacity-40">
              {saving ? <Loader2 size={15} className="animate-spin" /> : null} โพสต์
            </button>
          </div>
        </form>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={saveEdit} className="glass rounded-2xl p-5 w-full max-w-md space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold gradient-text">แก้ไขโพสต์</h2>
              <button type="button" onClick={() => setEditing(null)}><X size={20} /></button>
            </div>
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              rows={4}
              required
              className="w-full bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-400 resize-none"
            />
            {/* Current image */}
            {editing.imageUrl && !editRemoveImage && !editPending && (
              <div className="relative">
                <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                  <Image src={editing.imageUrl} alt="" fill className="object-cover" />
                </div>
                <button type="button" onClick={() => setEditRemoveImage(true)}
                  className="absolute top-2 right-2 bg-black/60 rounded-full p-1 hover:bg-red-500/60 transition-colors">
                  <X size={14} />
                </button>
              </div>
            )}
            {(editRemoveImage || !editing.imageUrl) && (
              <PhotoUploader label="เพิ่ม/เปลี่ยนรูป (ไม่บังคับ)" onUpload={setEditPending} />
            )}
            {editPending && (
              <button type="button" onClick={() => setEditPending(null)}
                className="text-xs text-red-400 hover:underline">ลบรูปใหม่</button>
            )}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-xl text-sm" style={{ background: "var(--input-bg)", color: "var(--muted)" }}>
                ยกเลิก
              </button>
              <button type="submit" disabled={!editContent.trim() || saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 disabled:opacity-40">
                {saving ? <Loader2 size={15} className="animate-spin" /> : null} บันทึก
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Feed */}
      <div className="space-y-4">
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-5 space-y-3 animate-pulse">
            <div className="h-3 w-24 rounded-full" style={{ background: "var(--input-bg)" }} />
            <div className="h-4 w-full rounded-full" style={{ background: "var(--input-bg)" }} />
            <div className="h-4 w-3/4 rounded-full" style={{ background: "var(--input-bg)" }} />
          </div>
        ))}

        {!loading && posts.map(post => (
          <div key={post.id} className="glass rounded-2xl p-5 space-y-3 group">
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                {post.authorId === myId ? "คุณ" : "คนรัก"} · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: th })}
                {post.updatedAt !== post.createdAt && <span className="ml-1">(แก้ไขแล้ว)</span>}
              </span>
              {post.authorId === myId && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(post)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" style={{ color: "var(--muted)" }}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deletePost(post.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
            <p className="whitespace-pre-wrap" style={{ color: "var(--foreground)" }}>{post.content}</p>
            {post.imageUrl && (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                <Image src={post.imageUrl} alt="" fill sizes="(max-width: 768px) 100vw, 672px" className="object-cover" />
              </div>
            )}
          </div>
        ))}

        {!loading && posts.length === 0 && (
          <div className="text-center py-20" style={{ color: "var(--muted-subtle)" }}>
            <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
            <p>ยังไม่มีโพสต์ เริ่มเขียนอันแรกเลย!</p>
          </div>
        )}
      </div>
    </div>
  );
}
