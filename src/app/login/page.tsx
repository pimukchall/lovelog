"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, Loader2, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    if (res?.error) {
      setError("Email หรือรหัสผ่านไม่ถูกต้อง");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="text-5xl heartbeat-anim">💕</div>
          <h1 className="text-3xl font-bold gradient-text">Lovelog</h1>
          <p style={{ color: "var(--muted)" }} className="text-sm">เข้าสู่พื้นที่ของคุณ</p>
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
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
              style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--foreground)" }}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs" style={{ color: "var(--muted)" }}>รหัสผ่าน</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--foreground)" }}
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="text-right">
            <Link href="/forgot-password" className="text-xs" style={{ color: "var(--muted)" }}>
              ลืมรหัสผ่าน?
            </Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 text-white"
            style={{ background: "linear-gradient(135deg, var(--gradient-text-from), var(--gradient-text-via))" }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Heart size={18} />}
            เข้าสู่ระบบ
          </button>
        </form>

        <p className="text-center text-sm" style={{ color: "var(--muted)" }}>
          ยังไม่มีบัญชี?{" "}
          <Link href="/register" className="font-semibold" style={{ color: "var(--accent)" }}>
            สมัครเลย
          </Link>
        </p>
      </div>
    </div>
  );
}
