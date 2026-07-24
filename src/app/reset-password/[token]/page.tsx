"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("รหัสผ่านไม่ตรงกัน"); return; }
    if (password.length < 6) { setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัว"); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    if (res.ok) {
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
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
          <h1 className="text-3xl font-bold gradient-text">ตั้งรหัสผ่านใหม่</h1>
        </div>

        {done ? (
          <div className="glass rounded-2xl p-6 text-center space-y-3">
            <CheckCircle size={48} className="mx-auto text-green-400" />
            <p className="font-medium" style={{ color: "var(--foreground)" }}>เปลี่ยนรหัสผ่านสำเร็จ!</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>กำลังพาไปหน้า login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4">
            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-center">
                {error}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs" style={{ color: "var(--muted)" }}>รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="••••••••"
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
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              บันทึกรหัสผ่านใหม่
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
