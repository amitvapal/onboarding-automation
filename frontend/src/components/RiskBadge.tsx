import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import type { RiskLevel } from "../lib/mockSignals";

const STYLE: Record<RiskLevel, string> = {
  low: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
  medium: "border-amber-400/25 bg-amber-500/10 text-amber-300",
  high: "border-rose-400/25 bg-rose-500/10 text-rose-300",
};

const ICON: Record<RiskLevel, typeof Shield> = {
  low: ShieldCheck,
  medium: Shield,
  high: ShieldAlert,
};

const LABEL: Record<RiskLevel, string> = {
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
};

export function RiskBadge({
  level,
  size = "md",
}: {
  level: RiskLevel;
  size?: "sm" | "md";
}) {
  const Icon = ICON[level];
  const padding = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full border font-medium " +
        STYLE[level] +
        " " +
        padding
      }
    >
      <Icon className="h-3 w-3" />
      {LABEL[level]}
    </span>
  );
}
