import { AlertTriangle, Check, CircleAlert, ShieldCheck } from "lucide-react";

export type ValidationState = "matched" | "verified" | "review" | "missing";

export interface FieldValidation {
  state: ValidationState;
  message: string;
}

interface FieldConfidenceCardProps {
  label: string;
  value: string;
  confidence: number;
  validation?: FieldValidation;
  onChange: (v: string) => void;
  onBlur: () => void;
  disabled?: boolean;
}

const VALIDATION_ICON: Record<ValidationState, typeof Check> = {
  matched: ShieldCheck,
  verified: Check,
  review: AlertTriangle,
  missing: CircleAlert,
};

const VALIDATION_COLOR: Record<ValidationState, string> = {
  matched: "text-emerald-300",
  verified: "text-emerald-300",
  review: "text-amber-300",
  missing: "text-rose-300",
};

export function FieldConfidenceCard({
  label,
  value,
  confidence,
  validation,
  onChange,
  onBlur,
  disabled,
}: FieldConfidenceCardProps) {
  const lowConfidence = confidence < 0.8;
  const pct = Math.round(confidence * 100);

  return (
    <div
      className={
        "rounded-xl border p-3.5 transition-colors " +
        (lowConfidence
          ? "border-amber-400/25 bg-amber-500/[0.04]"
          : "border-white/8 bg-white/[0.02]")
      }
    >
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            {label}
          </span>
          {lowConfidence && (
            <AlertTriangle className="h-3 w-3 text-amber-400" />
          )}
        </div>
        <span
          className={
            "text-[11px] font-semibold tabular-nums " +
            (lowConfidence ? "text-amber-300" : "text-emerald-300")
          }
        >
          {pct}%
        </span>
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        placeholder="—"
        className={
          "w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none transition-colors " +
          (lowConfidence
            ? "border-amber-400/30 focus:border-amber-400/60 focus:bg-amber-500/[0.03]"
            : "border-white/10 focus:border-blue-400/50 focus:bg-white/[0.03]") +
          " disabled:opacity-60 disabled:cursor-not-allowed"
        }
      />

      <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
        <div
          className={
            "h-full transition-all duration-500 " +
            (lowConfidence
              ? "bg-gradient-to-r from-amber-500 to-amber-300"
              : "bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-400")
          }
          style={{ width: `${pct}%` }}
        />
      </div>

      {validation && (
        <div
          className={
            "mt-2 flex items-center gap-1.5 text-xs " + VALIDATION_COLOR[validation.state]
          }
        >
          {(() => {
            const Icon = VALIDATION_ICON[validation.state];
            return <Icon className="h-3 w-3 shrink-0" />;
          })()}
          <span>{validation.message}</span>
        </div>
      )}
    </div>
  );
}
