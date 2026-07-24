"use client";

interface Props {
  label: string;
  count: number | string;
  unit: string;
  sub?: string;
  color: string;
}

export default function AnniversaryCard({ label, count, unit, sub, color }: Props) {
  return (
    <div className={`glass rounded-2xl p-5 neon-border flex flex-col gap-2 border-l-4 ${color}`}>
      <div className="text-xs uppercase tracking-widest" style={{ color: "var(--muted-subtle)" }}>{label}</div>
      <div className="text-4xl font-bold gradient-text leading-none">{count}</div>
      <div className="text-sm" style={{ color: "var(--muted)" }}>{unit}</div>
      {sub && <div className="text-xs mt-1" style={{ color: "var(--muted-subtle)" }}>{sub}</div>}
    </div>
  );
}
