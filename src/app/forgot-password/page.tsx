"use client";
import { useState } from "react";
import Link from "next/link";
import { Heart, Loader2, Mail, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      setSent(true);
    } else {
      const d = await res.json();
      setError(d.error || "เกิดข้อผิดพลาด");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="text-5xl float-anim">💕</div>
          <h1 className="text-3xl font-bold gradient-text">ลืมรหัสผ่าน</h1>
          <p style={{ color: "var(--muted)" }} className="text-sm">กรอก email แล้วเราจะส่งลิงก์ตั้งรหัสใหม่ให้</p>
        </div>

        {sent ? (
          <div className="glass rounded-2xl p-6 text-center space-y-3">
            <CheckCircle size={48} className="mx-auto text-green-400" />
            <p className="font-medium" style={{ color: "var(--foreground)" }}>ส่ง email แล้ว!</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>ตรวจสอบ inbox ของ {email} ลิงก์ใช้ได้ภายใน 1 ชั่วโมง</p>
            <Link href="/login" className="text-sm underline block mt-2" style={{ color: "var(--accent)" }}>
              กลับหน้าเข้าสู่ระบบ
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4">
            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-center">
                {error}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs" style={{ color: "var(--muted)" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--foreground)" }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 text-white"
              style={{ background: "linear-gradient(135deg, var(--gradient-text-from), var(--gradient-text-via))" }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
              ส่งลิงก์ตั้งรหัสใหม่
            </button>
          </form>
        )}

        <p className="text-center text-sm" style={{ color: "var(--muted)" }}>
          <Link href="/login" className="font-semibold" style={{ color: "var(--accent)" }}>
            กลับหน้าเข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
}
