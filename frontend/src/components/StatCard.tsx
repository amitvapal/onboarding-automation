import type { LucideIcon } from "lucide-react";

export type StatAccent = "blue" | "violet" | "cyan" | "emerald" | "amber" | "rose";

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: { value: string; positive?: boolean };
  icon: LucideIcon;
  accent?: StatAccent;
}

const ACCENT_BG: Record<StatAccent, string> = {
  blue: "from-blue-500/25 via-blue-500/5 to-transparent",
  violet: "from-violet-500/25 via-violet-500/5 to-transparent",
  cyan: "from-cyan-500/25 via-cyan-500/5 to-transparent",
  emerald: "from-emerald-500/25 via-emerald-500/5 to-transparent",
  amber: "from-amber-500/25 via-amber-500/5 to-transparent",
  rose: "from-rose-500/25 via-rose-500/5 to-transparent",
};

const ACCENT_ICON: Record<StatAccent, string> = {
  blue: "text-blue-300 bg-blue-500/15 border-blue-400/20",
  violet: "text-violet-300 bg-violet-500/15 border-violet-400/20",
  cyan: "text-cyan-300 bg-cyan-500/15 border-cyan-400/20",
  emerald: "text-emerald-300 bg-emerald-500/15 border-emerald-400/20",
  amber: "text-amber-300 bg-amber-500/15 border-amber-400/20",
  rose: "text-rose-300 bg-rose-500/15 border-rose-400/20",
};

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  accent = "blue",
}: StatCardProps) {
  return (
    <div className="card-glass relative overflow-hidden rounded-2xl p-5 ring-soft transition-transform duration-300 hover:-translate-y-0.5">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${ACCENT_BG[accent]} opacity-80 pointer-events-none`}
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            {label}
          </span>
          <div
            className={`h-7 w-7 rounded-lg border flex items-center justify-center ${ACCENT_ICON[accent]}`}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-3 text-3xl font-semibold text-white tracking-tight tabular-nums">
          {value}
        </div>
        {delta && (
          <div
            className={
              "mt-1.5 text-xs font-medium " +
              (delta.positive ? "text-emerald-300" : "text-rose-300")
            }
          >
            {delta.value}
          </div>
        )}
      </div>
    </div>
  );
}
