"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-8 h-8" />;

  const isLight = theme === "light";
  return (
    <button
      onClick={() => setTheme(isLight ? "dark" : "light")}
      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
      title={isLight ? "สลับธีมมืด" : "สลับธีมสว่าง"}
    >
      {isLight
        ? <Moon size={17} style={{ color: "var(--foreground)" }} />
        : <Sun size={17} style={{ color: "var(--foreground)" }} />}
    </button>
  );
}
