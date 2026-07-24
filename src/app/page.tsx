"use client";
import { useEffect, useState } from "react";
import { Heart, Calendar, Star } from "lucide-react";
import { getAnniversaryInfo } from "@/lib/anniversary";
import AnniversaryCard from "@/components/AnniversaryCard";
import Link from "next/link";

interface Couple {
  id: string;
  person1Name: string;
  person2Name: string;
  startDate: string;
}

export default function HomePage() {
  const [couple, setCouple] = useState<Couple | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/couple")
      .then((r) => r.json())
      .then((d) => { setCouple(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Heart size={40} className="animate-pulse text-pink-400" />
      </div>
    );
  }

  if (!couple) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 px-4">
        <div className="text-6xl heartbeat-anim">💕</div>
        <h1 className="text-3xl font-bold gradient-text text-center">Welcome to Lovelog</h1>
        <p className="text-[var(--muted)] text-center max-w-sm">
          เริ่มต้นเก็บความทรงจำสวยงามของคุณ ไปตั้งค่าข้อมูลคู่รักก่อนนะ
        </p>
        <Link
          href="/settings"
          className="px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 font-medium hover:opacity-90 transition-opacity"
        >
          ตั้งค่าเลย →
        </Link>
      </div>
    );
  }

  const info = getAnniversaryInfo(new Date(couple.startDate));

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="text-5xl float-anim">💕</div>
        <h1 className="text-4xl font-bold gradient-text">
          {couple.person1Name} & {couple.person2Name}
        </h1>
        <p className="text-[var(--muted)]">ร่วมกันมาตั้งแต่ {info.startDateFormatted}</p>
      </div>

      {/* Anniversary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AnniversaryCard
          label="อยู่ด้วยกัน"
          count={info.totalYears}
          unit="ปี"
          sub={`${info.totalMonths} เดือนรวม`}
          color="border-pink-500"
        />
        <AnniversaryCard
          label="เดือนที่"
          count={info.totalMonths}
          unit="เดือน"
          color="border-purple-500"
        />
        <AnniversaryCard
          label="ครบรอบเดือนหน้า"
          count={info.daysToNextMonth}
          unit={`วัน (${info.nextMonthly})`}
          color="border-blue-500"
        />
        <AnniversaryCard
          label="ครบรอบปีหน้า"
          count={info.daysToNextYear}
          unit={`วัน (${info.nextYearly})`}
          color="border-cyan-500"
        />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { href: "/timeline", icon: "🕐", label: "Timeline", desc: "ดูเรื่องราวทั้งหมด" },
          { href: "/gallery", icon: "📸", label: "Gallery", desc: "รูปภาพของเรา" },
          { href: "/family", icon: "🌳", label: "Family", desc: "ผังครอบครัว" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="glass rounded-2xl p-6 hover:neon-border transition-all hover:scale-[1.02] group"
          >
            <div className="text-4xl mb-3 group-hover:float-anim">{item.icon}</div>
            <div className="font-bold text-lg">{item.label}</div>
            <div className="text-[var(--muted)] text-sm">{item.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
