import type { LucideIcon } from "lucide-react";
import { Check, Workflow } from "lucide-react";

export type PipelineStatus = "queued" | "active" | "done";

export interface PipelineStep {
  label: string;
  description?: string;
  icon: LucideIcon;
  status: PipelineStatus;
}

export function PipelineTimeline({ steps }: { steps: PipelineStep[] }) {
  return (
    <div className="card-glass rounded-2xl p-5 ring-soft">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg border border-cyan-400/25 bg-cyan-500/10 flex items-center justify-center">
          <Workflow className="h-3.5 w-3.5 text-cyan-300" />
        </div>
        <h3 className="text-sm font-semibold text-white">Extraction Pipeline</h3>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Live processing stages from intake to review
      </p>

      <ol className="mt-5 space-y-1">
        {steps.map((s, i) => {
          const isLast = i === steps.length - 1;
          const Icon = s.icon;
          return (
            <li key={i} className="relative flex items-start gap-3 pb-3">
              {!isLast && (
                <span
                  aria-hidden
                  className={
                    "absolute left-[15px] top-8 bottom-1 w-px " +
                    (s.status === "done" ? "bg-emerald-400/30" : "bg-white/8")
                  }
                />
              )}
              <div className="relative shrink-0">
                <div
                  className={
                    "relative h-8 w-8 rounded-lg border flex items-center justify-center transition-colors " +
                    (s.status === "done"
                      ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                      : s.status === "active"
                      ? "border-blue-400/40 bg-blue-500/15 text-blue-300"
                      : "border-white/10 bg-white/[0.02] text-slate-500")
                  }
                >
                  {s.status === "done" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                {s.status === "active" && (
                  <span className="pointer-events-none absolute inset-0 rounded-lg border-2 border-blue-400/50 animate-ping" />
                )}
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2">
                  <span
                    className={
                      "text-sm font-medium " +
                      (s.status === "queued" ? "text-slate-400" : "text-white")
                    }
                  >
                    {s.label}
                  </span>
                  <span
                    className={
                      "text-[10px] uppercase tracking-wider rounded-full px-1.5 py-0.5 border " +
                      (s.status === "done"
                        ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
                        : s.status === "active"
                        ? "border-blue-400/30 bg-blue-500/10 text-blue-300 animate-pulse-soft"
                        : "border-white/10 bg-white/[0.02] text-slate-500")
                    }
                  >
                    {s.status}
                  </span>
                </div>
                {s.description && (
                  <div className="mt-0.5 text-xs text-slate-500">{s.description}</div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
