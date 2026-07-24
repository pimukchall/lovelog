"use client";
import { useState, useEffect } from "react";
import { Save, Heart, Link2, Copy, Check, RefreshCw, UserCheck, UserX, Trash2, AlertTriangle, Camera, KeyRound, Eye, EyeOff, Loader2 } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [form, setForm] = useState({ id: "", person1Name: "", person2Name: "", startDate: "" });
  const [photos, setPhotos] = useState<{ person1PhotoUrl?: string; person1PublicId?: string; person2PhotoUrl?: string; person2PublicId?: string }>({});
  const [saved, setSaved] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [hasCouple, setHasCouple] = useState(false);
  const [partnerLinked, setPartnerLinked] = useState(false);

  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [kickConfirm, setKickConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  // password change
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // photo upload state
  const [uploadingPhoto, setUploadingPhoto] = useState<"p1" | "p2" | null>(null);

  useEffect(() => {
    if (!session) return;
    fetch("/api/couple").then((r) => r.json()).then((d) => {
      if (!d) return;
      setHasCouple(true);
      setForm({ id: d.id, person1Name: d.person1Name, person2Name: d.person2Name, startDate: d.startDate?.split("T")[0] || "" });
      setPhotos({ person1PhotoUrl: d.person1PhotoUrl, person1PublicId: d.person1PublicId, person2PhotoUrl: d.person2PhotoUrl, person2PublicId: d.person2PublicId });
      setIsOwner(d.userId === session.user?.id);
      setPartnerLinked(!!d.partnerUserId);
    });
  }, [session]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const method = form.id ? "PUT" : "POST";
    const res = await fetch("/api/couple", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, ...photos }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.id) setForm((f) => ({ ...f, id: data.id }));
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function uploadPhoto(file: File, slot: "p1" | "p2") {
    setUploadingPhoto(slot);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) { setUploadingPhoto(null); return; }
    const { url, publicId } = await res.json();
    const update = slot === "p1"
      ? { person1PhotoUrl: url, person1PublicId: publicId }
      : { person2PhotoUrl: url, person2PublicId: publicId };
    setPhotos((p) => ({ ...p, ...update }));
    await fetch("/api/couple", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    setUploadingPhoto(null);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg({ ok: false, text: "รหัสผ่านใหม่ไม่ตรงกัน" });
      return;
    }
    if (pwForm.next.length < 8) {
      setPwMsg({ ok: false, text: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" });
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    const res = await fetch("/api/account/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
    });
    setPwSaving(false);
    if (res.ok) {
      setPwMsg({ ok: true, text: "เปลี่ยนรหัสผ่านสำเร็จ" });
      setPwForm({ current: "", next: "", confirm: "" });
    } else {
      const data = await res.json();
      setPwMsg({ ok: false, text: data.error === "wrong_password" ? "รหัสผ่านปัจจุบันไม่ถูกต้อง" : "เกิดข้อผิดพลาด" });
    }
  }

  async function generateInvite() {
    setLoadingInvite(true);
    const res = await fetch("/api/invite").then((r) => r.json());
    setInviteToken(res.token);
    setLoadingInvite(false);
  }

  async function revokeInvite() {
    await fetch("/api/invite", { method: "DELETE" });
    setInviteToken(null);
  }

  async function deleteAccount() {
    if (deleteInput !== "ลบบัญชี") return;
    setDeleting(true);
    await fetch("/api/account", { method: "DELETE" });
    await signOut({ callbackUrl: "/login" });
  }

  async function kickPartner() {
    await fetch("/api/partner", { method: "DELETE" });
    setPartnerLinked(false);
    setKickConfirm(false);
  }

  function copyLink() {
    if (!inviteToken) return;
    navigator.clipboard.writeText(`${window.location.origin}/join/${inviteToken}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inviteUrl = inviteToken ? `${typeof window !== "undefined" ? window.location.origin : ""}/join/${inviteToken}` : "";

  const avatarInput = (slot: "p1" | "p2") => (
    <label className="relative cursor-pointer group">
      <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
        style={{ background: "var(--input-bg)", border: "2px solid var(--glass-border)" }}>
        {(slot === "p1" ? photos.person1PhotoUrl : photos.person2PhotoUrl) ? (
          <Image src={(slot === "p1" ? photos.person1PhotoUrl : photos.person2PhotoUrl)!}
            alt="" width={80} height={80} className="object-cover w-full h-full" />
        ) : (
          <span className="text-2xl">👤</span>
        )}
        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {uploadingPhoto === slot
            ? <Loader2 size={20} className="animate-spin text-white" />
            : <Camera size={20} className="text-white" />}
        </div>
      </div>
      <input type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f, slot); }} />
    </label>
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold gradient-text">ตั้งค่า</h1>

      {/* ─── Couple info ─── */}
      <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-5">
        <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>ข้อมูลคู่รัก</h2>

        {/* Profile photos */}
        {isOwner && (
          <div className="flex items-end gap-6">
            <div className="text-center space-y-1">
              {avatarInput("p1")}
              <p className="text-xs" style={{ color: "var(--muted)" }}>{form.person1Name || "คนที่ 1"}</p>
            </div>
            <div className="text-center space-y-1">
              {avatarInput("p2")}
              <p className="text-xs" style={{ color: "var(--muted)" }}>{form.person2Name || "คนที่ 2"}</p>
            </div>
          </div>
        )}

        <div>
          <label className="text-sm mb-1 block" style={{ color: "var(--muted)" }}>ชื่อคนที่ 1</label>
          <input value={form.person1Name} onChange={(e) => setForm({ ...form, person1Name: e.target.value })}
            className="w-full rounded-xl px-4 py-2.5 focus:outline-none transition-colors"
            style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--foreground)" }}
            placeholder="ชื่อของคุณ" required />
        </div>
        <div>
          <label className="text-sm mb-1 block" style={{ color: "var(--muted)" }}>ชื่อคนที่ 2</label>
          <input value={form.person2Name} onChange={(e) => setForm({ ...form, person2Name: e.target.value })}
            className="w-full rounded-xl px-4 py-2.5 focus:outline-none transition-colors"
            style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--foreground)" }}
            placeholder="ชื่อคนรัก" required />
        </div>
        <div>
          <label className="text-sm mb-1 block" style={{ color: "var(--muted)" }}>วันที่เริ่มคบ</label>
          <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            className="w-full rounded-xl px-4 py-2.5 focus:outline-none transition-colors"
            style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--foreground)" }}
            required />
        </div>
        <button type="submit"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity text-white"
          style={{ background: "linear-gradient(135deg, #ff6b9d, #c44dff)" }}>
          {saved ? <><Heart size={18} className="heartbeat-anim" /> บันทึกแล้ว!</> : <><Save size={18} /> บันทึก</>}
        </button>
      </form>

      {/* ─── Change password ─── */}
      <form onSubmit={handlePasswordChange} className="glass rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <KeyRound size={18} style={{ color: "var(--accent)" }} /> เปลี่ยนรหัสผ่าน
        </h2>
        <div className="relative">
          <label className="text-sm mb-1 block" style={{ color: "var(--muted)" }}>รหัสผ่านปัจจุบัน</label>
          <input type={showPw ? "text" : "password"} value={pwForm.current}
            onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
            className="w-full rounded-xl px-4 py-2.5 pr-10 focus:outline-none"
            style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--foreground)" }}
            placeholder="••••••••" required />
          <button type="button" onClick={() => setShowPw(!showPw)}
            className="absolute right-3 bottom-2.5" style={{ color: "var(--muted)" }}>
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <div>
          <label className="text-sm mb-1 block" style={{ color: "var(--muted)" }}>รหัสผ่านใหม่</label>
          <input type={showPw ? "text" : "password"} value={pwForm.next}
            onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
            className="w-full rounded-xl px-4 py-2.5 focus:outline-none"
            style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--foreground)" }}
            placeholder="อย่างน้อย 8 ตัว" required />
        </div>
        <div>
          <label className="text-sm mb-1 block" style={{ color: "var(--muted)" }}>ยืนยันรหัสผ่านใหม่</label>
          <input type={showPw ? "text" : "password"} value={pwForm.confirm}
            onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
            className="w-full rounded-xl px-4 py-2.5 focus:outline-none"
            style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--foreground)" }}
            placeholder="••••••••" required />
        </div>
        {pwMsg && (
          <p className={`text-sm ${pwMsg.ok ? "text-green-400" : "text-red-400"}`}>{pwMsg.text}</p>
        )}
        <button type="submit" disabled={pwSaving}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity text-white disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #ff6b9d, #c44dff)" }}>
          {pwSaving ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
          เปลี่ยนรหัสผ่าน
        </button>
      </form>

      {/* ─── Invite partner (เฉพาะเจ้าของ) ─── */}
      {isOwner && (
        <div className="glass rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <Link2 size={18} style={{ color: "var(--accent)" }} /> ชวนคนรัก
          </h2>
          {partnerLinked ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-green-400">
                <UserCheck size={18} /> เชื่อมต่อคู่รักแล้ว ✓
              </div>
              {!kickConfirm ? (
                <button onClick={() => setKickConfirm(true)}
                  className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-red-400 hover:bg-red-500/10"
                  style={{ border: "1px solid rgba(239,68,68,0.2)" }}>
                  <UserX size={13} /> ตัดการเชื่อมต่อ partner
                </button>
              ) : (
                <div className="glass rounded-xl p-4 space-y-3" style={{ border: "1px solid rgba(239,68,68,0.3)" }}>
                  <p className="text-sm text-red-400 font-medium">⚠️ ยืนยันตัดการเชื่อมต่อ?</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>partner จะไม่สามารถเข้าดูข้อมูลได้อีก ข้อมูลทั้งหมดยังอยู่ครบ</p>
                  <div className="flex gap-2">
                    <button onClick={kickPartner} className="flex-1 py-2 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors">ยืนยัน</button>
                    <button onClick={() => setKickConfirm(false)} className="flex-1 py-2 rounded-lg text-sm transition-colors" style={{ background: "var(--input-bg)", color: "var(--muted)" }}>ยกเลิก</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <p className="text-sm" style={{ color: "var(--muted)" }}>generate ลิงก์แล้วส่งให้คนรักของคุณ</p>
              {!inviteToken ? (
                <button onClick={generateInvite} disabled={loadingInvite}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity text-white disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, var(--gradient-text-from), var(--gradient-text-via))" }}>
                  <Link2 size={15} /> สร้างลิงก์ชวน
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl px-3 py-2.5 text-xs font-mono break-all"
                    style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--muted)" }}>
                    {inviteUrl}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={copyLink}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity text-white"
                      style={{ background: "linear-gradient(135deg, var(--gradient-text-from), var(--gradient-text-via))" }}>
                      {copied ? <><Check size={15} /> คัดลอกแล้ว!</> : <><Copy size={15} /> คัดลอกลิงก์</>}
                    </button>
                    <button onClick={revokeInvite} className="px-3 py-2 rounded-xl text-sm hover:bg-red-500/10 transition-colors text-red-400"
                      style={{ border: "1px solid rgba(239,68,68,0.2)" }} title="ยกเลิกลิงก์"><UserX size={15} /></button>
                    <button onClick={generateInvite} className="px-3 py-2 rounded-xl text-sm transition-colors"
                      style={{ border: "1px solid var(--input-border)", color: "var(--muted)" }} title="สร้างลิงก์ใหม่"><RefreshCw size={15} /></button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {hasCouple && !isOwner && (
        <div className="glass rounded-2xl p-5 flex items-center gap-3 text-sm"
          style={{ border: "1px solid var(--glass-border)", color: "var(--muted)" }}>
          <Heart size={18} className="text-pink-400 shrink-0" />
          คุณเชื่อมต่อกับ Lovelog นี้ในฐานะคู่รักแล้ว
        </div>
      )}

      {/* ─── Danger zone ─── */}
      <div className="rounded-2xl p-6 space-y-4" style={{ border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.04)" }}>
        <h2 className="font-semibold text-red-400 flex items-center gap-2">
          <AlertTriangle size={18} /> Danger Zone
        </h2>
        {!deleteConfirm ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>ลบบัญชีของฉัน</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                {isOwner ? "ลบบัญชีและข้อมูลทั้งหมด อย่างถาวร" : "ออกจาก Lovelog นี้ ข้อมูลของคู่ยังอยู่ครบ"}
              </p>
            </div>
            <button onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors shrink-0 ml-4"
              style={{ border: "1px solid rgba(239,68,68,0.3)" }}>
              <Trash2 size={14} /> ลบบัญชี
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-400 font-medium">
              ⚠️ {isOwner ? "การกระทำนี้ไม่สามารถย้อนกลับได้" : "คุณจะออกจาก Lovelog นี้"}
            </p>
            <div className="space-y-1">
              <label className="text-xs" style={{ color: "var(--muted)" }}>
                พิมพ์ <span className="font-mono font-bold text-red-400">ลบบัญชี</span> เพื่อยืนยัน
              </label>
              <input value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)} placeholder="ลบบัญชี"
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                style={{ background: "var(--input-bg)", border: "1px solid rgba(239,68,68,0.4)", color: "var(--foreground)" }} />
            </div>
            <div className="flex gap-2">
              <button onClick={deleteAccount} disabled={deleteInput !== "ลบบัญชี" || deleting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-40">
                {deleting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 size={14} />}
                {isOwner ? "ลบบัญชีและข้อมูลทั้งหมด" : "ออกจาก Lovelog นี้"}
              </button>
              <button onClick={() => { setDeleteConfirm(false); setDeleteInput(""); }}
                className="px-4 py-2.5 rounded-xl text-sm transition-colors"
                style={{ background: "var(--input-bg)", color: "var(--muted)" }}>
                ยกเลิก
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
