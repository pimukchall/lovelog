"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Images, Clock, TreePine, Settings, BookOpen } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";

const links = [
  { href: "/", label: "Home", icon: Heart },
  { href: "/posts", label: "Posts", icon: BookOpen },
  { href: "/timeline", label: "Timeline", icon: Clock },
  { href: "/gallery", label: "Gallery", icon: Images },
  { href: "/family", label: "Family", icon: TreePine },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md border-b"
      style={{ background: "var(--nav-bg)", borderColor: "var(--glass-border)" }}>
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="gradient-text font-bold text-lg tracking-tight">
          Lovelog
        </Link>
        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  active ? "neon-border" : "hover:bg-white/5"
                }`}
                style={{
                  color: active ? "var(--accent)" : "var(--muted)",
                  background: active ? "color-mix(in srgb, var(--accent) 15%, transparent)" : undefined,
                }}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
          <div className="ml-1 pl-1 border-l flex items-center gap-1" style={{ borderColor: "var(--glass-border)" }}>
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}
