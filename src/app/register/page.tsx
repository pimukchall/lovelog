"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, Loader2, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const nextUrl = params?.get("next") || "/settings";
  const [form, setForm] = useState({ email: "", password: "", confirm: "" });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) { setError("กรุณายอมรับนโยบายความเป็นส่วนตัวก่อน"); return; }
    if (form.password !== form.confirm) { setError("รหัสผ่านไม่ตรงกัน"); return; }
    if (form.password.length < 6) { setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัว"); return; }
    setLoading(true);
    setError("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email, password: form.password }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }

    await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    router.push(nextUrl);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="text-5xl float-anim">💕</div>
          <h1 className="text-3xl font-bold gradient-text">สร้างบัญชีใหม่</h1>
          <p style={{ color: "var(--muted)" }} className="text-sm">เริ่มเก็บความทรงจำของคุณ</p>
        </div>

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
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              placeholder="your@email.com"
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
              style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--foreground)" }}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs" style={{ color: "var(--muted)" }}>รหัสผ่าน (อย่างน้อย 6 ตัว)</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none transition-colors"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--foreground)" }}
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs" style={{ color: "var(--muted)" }}>ยืนยันรหัสผ่าน</label>
            <input
              type={showPw ? "text" : "password"}
              value={form.confirm}
              onChange={e => setForm({ ...form, confirm: e.target.value })}
              required
              placeholder="••••••••"
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
              style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--foreground)" }}
            />
          </div>
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 shrink-0 accent-pink-500"
            />
            <span className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
              ฉันยอมรับ{" "}
              <Link href="/privacy" target="_blank" className="underline font-medium" style={{ color: "var(--accent)" }}>
                นโยบายความเป็นส่วนตัว
              </Link>
              {" "}และยินยอมให้ Lovelog เก็บข้อมูลของฉันตามที่ระบุไว้
            </span>
          </label>
          <button
            type="submit"
            disabled={loading || !agreed}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 text-white"
            style={{ background: "linear-gradient(135deg, var(--gradient-text-from), var(--gradient-text-via))" }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Heart size={18} />}
            สมัครสมาชิก
          </button>
        </form>

        <p className="text-center text-sm" style={{ color: "var(--muted)" }}>
          มีบัญชีแล้ว?{" "}
          <Link href="/login" className="font-semibold" style={{ color: "var(--accent)" }}>
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
}
