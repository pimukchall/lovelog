"use client";
import { useSession, signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import { useState } from "react";

export default function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  if (!session) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-[var(--card-hover)] transition-colors"
      >
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: "var(--accent)", color: "#fff" }}>
          {session.user?.email?.[0]?.toUpperCase()}
        </div>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 glass rounded-xl p-1 w-52 shadow-lg"
            style={{ border: "1px solid var(--glass-border)" }}>
            <div className="px-3 py-2 text-xs truncate" style={{ color: "var(--muted)" }}>
              {session.user?.email}
            </div>
            <div className="h-px my-1" style={{ background: "var(--glass-border)" }} />
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-[var(--card-hover)] transition-colors text-red-400"
            >
              <LogOut size={14} /> ออกจากระบบ
            </button>
          </div>
        </>
      )}
    </div>
  );
}
