"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Heart, Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

type State = "loading" | "ready" | "joining" | "success" | "error" | "conflict";

export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [state, setState] = useState<State>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push(`/register?next=/join/${token}`);
      return;
    }
    setState("ready");
  }, [session, status, token, router]);

  async function accept() {
    setState("joining");
    const res = await fetch("/api/invite/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (res.ok) {
      setState("success");
      setTimeout(() => router.push("/"), 2000);
    } else if (res.status === 409 && data.error?.includes("มีข้อมูลคู่รัก")) {
      setState("conflict");
    } else {
      setErrorMsg(data.error || "เกิดข้อผิดพลาด");
      setState("error");
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">

        {state === "loading" && (
          <div className="text-center">
            <Loader2 size={40} className="animate-spin mx-auto" style={{ color: "var(--accent)" }} />
          </div>
        )}

        {state === "ready" && (
          <div className="text-center space-y-6">
            <div className="text-6xl heartbeat-anim">💕</div>
            <h1 className="text-2xl font-bold gradient-text">มีคนชวนคุณเข้า Lovelog</h1>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              กดยืนยันเพื่อเชื่อมต่อและดูข้อมูลคู่รักร่วมกัน
            </p>
            <button
              onClick={accept}
              className="w-full py-3 rounded-xl font-medium text-white hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg, var(--gradient-text-from), var(--gradient-text-via))" }}
            >
              <Heart size={16} className="inline mr-2" />
              ยืนยันเข้าร่วม
            </button>
          </div>
        )}

        {state === "joining" && (
          <div className="text-center space-y-4">
            <Loader2 size={40} className="animate-spin mx-auto" style={{ color: "var(--accent)" }} />
            <p style={{ color: "var(--muted)" }}>กำลังเชื่อมต่อ...</p>
          </div>
        )}

        {state === "success" && (
          <div className="text-center space-y-4">
            <CheckCircle size={56} className="mx-auto text-green-400" />
            <h2 className="text-xl font-bold gradient-text">เชื่อมต่อสำเร็จ! 💕</h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>กำลังพาไปหน้าหลัก...</p>
          </div>
        )}

        {state === "conflict" && (
          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={24} className="text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="font-bold text-yellow-400">บัญชีนี้มีข้อมูลคู่รักอยู่แล้ว</h2>
                <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                  คุณเชื่อมต่อกับ Lovelog อื่นอยู่ ไม่สามารถเข้าร่วมได้พร้อมกัน
                </p>
              </div>
            </div>
            <div className="text-sm space-y-2" style={{ color: "var(--muted)" }}>
              <p>ทางออก:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>ให้เจ้าของ Lovelog เดิมตัดคุณออกก่อน แล้วค่อยกลับมาคลิกลิงก์นี้ใหม่</li>
                <li>หรือสมัครบัญชีใหม่ด้วย email อื่น</li>
              </ul>
            </div>
            <div className="flex gap-2 pt-1">
              <Link href="/"
                className="flex-1 py-2 rounded-xl text-sm text-center font-medium hover:opacity-90 transition-opacity text-white"
                style={{ background: "linear-gradient(135deg, var(--gradient-text-from), var(--gradient-text-via))" }}>
                ไปหน้าหลัก
              </Link>
              <Link href="/register"
                className="flex-1 py-2 rounded-xl text-sm text-center transition-colors"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--muted)" }}>
                สมัคร email ใหม่
              </Link>
            </div>
          </div>
        )}

        {state === "error" && (
          <div className="text-center space-y-4">
            <XCircle size={56} className="mx-auto text-red-400" />
            <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>เกิดข้อผิดพลาด</h2>
            <p className="text-sm text-red-400">{errorMsg}</p>
            <Link href="/" style={{ color: "var(--accent)" }} className="text-sm underline block">
              กลับหน้าหลัก
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
