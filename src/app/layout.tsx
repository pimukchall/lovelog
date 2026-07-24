import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import ThemeProvider from "@/components/ThemeProvider";
import SessionProvider from "@/components/SessionProvider";

const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "💕 Lovelog",
  description: "บันทึกความรักของเรา",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${prompt.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col" style={{ background: "var(--background)", color: "var(--foreground)" }}>
        <SessionProvider>
          <ThemeProvider>
            <Nav />
            <main className="flex-1">{children}</main>
            <footer className="text-center py-5 text-xs space-y-2" style={{ color: "var(--muted)", borderTop: "1px solid var(--glass-border)" }}>
              <div>พัฒนาโดย Pimuk Artharnnarong &nbsp;·&nbsp;{" "}
                <a href="/privacy" className="underline hover:opacity-80 transition-opacity">นโยบายความเป็นส่วนตัว</a>
              </div>
              <div>
                <a
                  href="https://ko-fi.com/pimuk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium hover:opacity-80 transition-opacity"
                  style={{ background: "rgba(255,94,105,0.12)", color: "#ff5e69", border: "1px solid rgba(255,94,105,0.25)" }}
                >
                  ☕ สนับสนุนผู้พัฒนา
                </a>
              </div>
            </footer>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
