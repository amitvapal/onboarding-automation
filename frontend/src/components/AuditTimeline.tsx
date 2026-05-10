import {
  ArrowRight,
  PencilLine,
  ScrollText,
  ShieldCheck,
  ShieldX,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { AuditLogEntry } from "../api";

const ACTION_ICON: Record<string, LucideIcon> = {
  updated: PencilLine,
  approved: ShieldCheck,
  rejected: ShieldX,
  created: Sparkles,
};

const ACTION_STYLE: Record<string, string> = {
  updated: "bg-blue-500/15 text-blue-300 border-blue-400/25",
  approved: "bg-emerald-500/15 text-emerald-300 border-emerald-400/25",
  rejected: "bg-rose-500/15 text-rose-300 border-rose-400/25",
  created: "bg-violet-500/15 text-violet-300 border-violet-400/25",
};

export function AuditTimeline({ entries }: { entries: AuditLogEntry[] }) {
  return (
    <div className="card-glass rounded-2xl p-6 ring-soft">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg border border-cyan-400/25 bg-cyan-500/10 flex items-center justify-center">
          <ScrollText className="h-3.5 w-3.5 text-cyan-300" />
        </div>
        <h3 className="text-sm font-semibold text-white">Audit timeline</h3>
        <span className="ml-auto rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] font-medium text-slate-400">
          {entries.length} event{entries.length === 1 ? "" : "s"}
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Compliance-grade record of every decision, edit, and signal applied to this vendor.
      </p>

      {entries.length === 0 ? (
        <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.015] p-10 text-center">
          <div className="mx-auto h-10 w-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-2">
            <ScrollText className="h-4 w-4 text-slate-500" />
          </div>
          <p className="text-sm text-slate-300">No actions yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Edits, approvals, and rejections will appear here in real time.
          </p>
        </div>
      ) : (
        <ol className="mt-5 space-y-3">
          {entries.map((e) => {
            const Icon = ACTION_ICON[e.action] ?? PencilLine;
            const style = ACTION_STYLE[e.action] ?? ACTION_STYLE.updated;
            return (
              <li key={e.id} className="flex items-start gap-4">
                <div
                  className={
                    "shrink-0 flex h-10 w-10 items-center justify-center rounded-xl border " +
                    style
                  }
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <span className="text-sm font-medium text-white capitalize">
                        {e.action}
                      </span>
                      <span className="ml-2 text-xs text-slate-400">
                        by <span className="text-slate-200">{e.actor}</span>
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 tabular-nums">
                      {new Date(e.timestamp).toLocaleString()}
                    </span>
                  </div>

                  {e.action === "rejected" &&
                    typeof e.after_json?.["reason"] === "string" && (
                      <div className="mt-2 rounded-lg border border-rose-400/20 bg-rose-500/[0.06] px-3 py-2 text-xs text-rose-200">
                        <span className="font-medium text-rose-300">Reason: </span>
                        {String(e.after_json["reason"])}
                      </div>
                    )}

                  {e.action === "updated" && (
                    <DiffList before={e.before_json} after={e.after_json} />
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function DiffList({
  before,
  after,
}: {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}) {
  if (!before || !after) return null;
  const changed = Object.keys(after).filter((k) => before[k] !== after[k]);
  if (changed.length === 0) return null;

  return (
    <div className="mt-2 space-y-1.5">
      {changed.map((k) => (
        <div
          key={k}
          className="flex items-center gap-2 text-xs rounded-md bg-white/[0.02] border border-white/5 px-2 py-1.5"
        >
          <span className="font-mono text-slate-500 w-32 shrink-0 truncate">{k}</span>
          <span className="text-slate-500 line-through truncate">
            {format(before[k])}
          </span>
          <ArrowRight className="h-3 w-3 text-slate-600 shrink-0" />
          <span className="text-slate-200 truncate">{format(after[k])}</span>
        </div>
      ))}
    </div>
  );
}

function format(v: unknown): string {
  if (v === null || v === undefined || v === "") return "(empty)";
  return String(v);
}
