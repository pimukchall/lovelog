"use client";
import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Pencil, X, Loader2, BookOpen, Send } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import PhotoUploader from "@/components/PhotoUploader";

interface PostComment {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
}

interface PostReaction {
  id: string;
  authorId: string;
  emoji: string;
}

interface Post {
  id: string;
  authorId: string;
  content: string;
  imageUrl?: string;
  publicId?: string;
  createdAt: string;
  updatedAt: string;
  comments: PostComment[];
  reactions: PostReaction[];
}

const EMOJIS = ["❤️", "😊", "😂", "😢", "😮", "🥰"];

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
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [commentSaving, setCommentSaving] = useState<string | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState<string | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const myId = session?.user?.id;

  // ปิด emoji picker เมื่อคลิกนอก
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setEmojiPickerOpen(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
    setPosts(prev => [{ ...post, comments: [], reactions: [] }, ...prev]);
    setContent(""); setPending(null); setShowForm(false); setSaving(false);
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
    setPosts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
    setEditing(null); setEditPending(null); setEditRemoveImage(false); setSaving(false);
  }

  async function deletePost(id: string) {
    await fetch(`/api/posts?id=${id}`, { method: "DELETE" });
    setPosts(prev => prev.filter(p => p.id !== id));
  }

  async function toggleReaction(postId: string, emoji: string) {
    const res = await fetch("/api/posts/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, emoji }),
    });
    const { action } = await res.json();
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      if (action === "added") {
        return { ...p, reactions: [...p.reactions, { id: Date.now().toString(), authorId: myId!, emoji }] };
      }
      return { ...p, reactions: p.reactions.filter(r => !(r.authorId === myId && r.emoji === emoji)) };
    }));
  }

  async function addComment(postId: string) {
    const text = commentText[postId]?.trim();
    if (!text) return;
    setCommentSaving(postId);
    const res = await fetch("/api/posts/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, content: text }),
    });
    const comment = await res.json();
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, comment] } : p));
    setCommentText(prev => ({ ...prev, [postId]: "" }));
    setCommentSaving(null);
  }

  async function deleteComment(postId: string, commentId: string) {
    await fetch(`/api/posts/comments?id=${commentId}`, { method: "DELETE" });
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, comments: p.comments.filter(c => c.id !== commentId) }
      : p));
  }

  function reactionSummary(reactions: PostReaction[]) {
    const counts: Record<string, { count: number; mine: boolean }> = {};
    for (const r of reactions) {
      if (!counts[r.emoji]) counts[r.emoji] = { count: 0, mine: false };
      counts[r.emoji].count++;
      if (r.authorId === myId) counts[r.emoji].mine = true;
    }
    return counts;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold gradient-text">โพสต์</h1>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-sm font-medium hover:opacity-90">
          <Plus size={16} /> เขียนโพสต์
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={createPost} className="glass rounded-2xl p-5 space-y-3">
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="เขียนอะไรสักอย่าง..." rows={4} required autoFocus
            className="w-full bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-400 resize-none" />
          <PhotoUploader label="เพิ่มรูป (ไม่บังคับ)" onUpload={setPending} preview={pending?.url} />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setShowForm(false); setContent(""); setPending(null); }}
              className="px-4 py-2 rounded-xl text-sm" style={{ background: "var(--input-bg)", color: "var(--muted)" }}>ยกเลิก</button>
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
            <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={4} required
              className="w-full bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-400 resize-none" />
            {editing.imageUrl && !editRemoveImage && !editPending && (
              <div className="relative">
                <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                  <Image src={editing.imageUrl} alt="" fill className="object-cover" />
                </div>
                <button type="button" onClick={() => setEditRemoveImage(true)}
                  className="absolute top-2 right-2 bg-black/60 rounded-full p-1 hover:bg-red-500/60"><X size={14} /></button>
              </div>
            )}
            {(editRemoveImage || !editing.imageUrl) && <PhotoUploader label="เพิ่ม/เปลี่ยนรูป" onUpload={setEditPending} />}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-xl text-sm" style={{ background: "var(--input-bg)", color: "var(--muted)" }}>ยกเลิก</button>
              <button type="submit" disabled={!editContent.trim() || saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 disabled:opacity-40">
                {saving ? <Loader2 size={15} className="animate-spin" /> : null} บันทึก
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <Image src={lightbox} alt="" width={900} height={600} className="rounded-2xl object-contain max-h-[85vh] w-full" />
            <button onClick={() => setLightbox(null)} className="absolute top-2 right-2 bg-black/60 rounded-full p-2 hover:bg-white/10"><X size={20} /></button>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="space-y-5">
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-5 space-y-3 animate-pulse">
            <div className="h-3 w-24 rounded-full" style={{ background: "var(--input-bg)" }} />
            <div className="h-4 w-full rounded-full" style={{ background: "var(--input-bg)" }} />
          </div>
        ))}

        {!loading && posts.map(post => {
          const summary = reactionSummary(post.reactions);
          return (
            <div key={post.id} className="glass rounded-2xl p-5 space-y-4 group">
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  {post.authorId === myId ? "คุณ" : "คนรัก"} · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: th })}
                  {post.updatedAt !== post.createdAt && <span className="ml-1">(แก้ไขแล้ว)</span>}
                </span>
                {post.authorId === myId && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditing(post); setEditContent(post.content); setEditPending(null); setEditRemoveImage(false); }}
                      className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: "var(--muted)" }}><Pencil size={14} /></button>
                    <button onClick={() => deletePost(post.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400"><Trash2 size={14} /></button>
                  </div>
                )}
              </div>

              {/* Content */}
              <p className="whitespace-pre-wrap" style={{ color: "var(--foreground)" }}>{post.content}</p>

              {/* Image */}
              {post.imageUrl && (
                <div onClick={() => setLightbox(post.imageUrl!)}
                  className="relative w-full aspect-video rounded-xl overflow-hidden cursor-pointer hover:opacity-95 transition-opacity">
                  <Image src={post.imageUrl} alt="" fill sizes="(max-width: 768px) 100vw, 672px" className="object-cover" />
                </div>
              )}

              {/* Reactions */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Existing reactions */}
                {Object.entries(summary).map(([emoji, { count, mine }]) => (
                  <button key={emoji} onClick={() => toggleReaction(post.id, emoji)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-all"
                    style={{
                      background: mine ? "color-mix(in srgb, var(--accent) 20%, transparent)" : "var(--input-bg)",
                      border: `1px solid ${mine ? "var(--accent)" : "var(--glass-border)"}`,
                    }}>
                    <span>{emoji}</span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>{count}</span>
                  </button>
                ))}
                {/* Add reaction picker */}
                <div className="relative" ref={emojiPickerOpen === post.id ? emojiPickerRef : null}>
                  <button
                    onClick={() => setEmojiPickerOpen(emojiPickerOpen === post.id ? null : post.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-all hover:bg-white/5"
                    style={{ border: "1px solid var(--glass-border)", color: "var(--muted)" }}>
                    + 😊
                  </button>
                  {emojiPickerOpen === post.id && (
                    <div className="absolute bottom-full left-0 mb-2 flex gap-1 p-2 rounded-xl shadow-xl z-10"
                      style={{ background: "var(--nav-bg)", border: "1px solid var(--glass-border)" }}>
                      {EMOJIS.map(emoji => (
                        <button key={emoji} onClick={() => { toggleReaction(post.id, emoji); setEmojiPickerOpen(null); }}
                          className="text-xl hover:scale-125 transition-transform p-0.5">{emoji}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Comments */}
              <div className="space-y-2 pt-1 border-t" style={{ borderColor: "var(--glass-border)" }}>
                {post.comments.map(c => (
                  <div key={c.id} className="flex items-start gap-2 group/comment">
                    <div className="flex-1">
                      <span className="text-xs font-medium mr-2" style={{ color: "var(--accent)" }}>
                        {c.authorId === myId ? "คุณ" : "คนรัก"}
                      </span>
                      <span className="text-sm" style={{ color: "var(--foreground)" }}>{c.content}</span>
                    </div>
                    {c.authorId === myId && (
                      <button onClick={() => deleteComment(post.id, c.id)}
                        className="opacity-0 group-hover/comment:opacity-100 transition-opacity text-red-400 hover:text-red-300 shrink-0 mt-0.5">
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}

                {/* Comment input */}
                <div className="flex gap-2 mt-2">
                  <input
                    value={commentText[post.id] ?? ""}
                    onChange={e => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addComment(post.id); } }}
                    placeholder="เขียนคอมเม้น..."
                    className="flex-1 bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-purple-400"
                  />
                  <button onClick={() => addComment(post.id)} disabled={!commentText[post.id]?.trim() || commentSaving === post.id}
                    className="px-3 py-1.5 rounded-xl text-sm bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 disabled:opacity-40">
                    {commentSaving === post.id ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

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
