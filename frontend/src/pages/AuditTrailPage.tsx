import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  PencilLine,
  ScrollText,
  ShieldCheck,
  ShieldX,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { api, type AuditLogEntry, type Vendor } from "../api";
import { StatCard } from "../components/StatCard";

interface FlatEvent {
  entry: AuditLogEntry;
  vendor: Vendor;
}

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

export function AuditTrailPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [events, setEvents] = useState<FlatEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const vs = await api.listVendors();
        if (cancelled) return;
        setVendors(vs);
        const histories = await Promise.all(
          vs.map((v) =>
            api
              .getVendorHistory(v.id)
              .then((rows) => rows.map((entry) => ({ entry, vendor: v })))
              .catch(() => [] as FlatEvent[]),
          ),
        );
        if (cancelled) return;
        const flat = histories.flat();
        flat.sort(
          (a, b) =>
            +new Date(b.entry.timestamp) - +new Date(a.entry.timestamp),
        );
        setEvents(flat);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    return {
      total: events.length,
      approvals: events.filter((e) => e.entry.action === "approved").length,
      rejections: events.filter((e) => e.entry.action === "rejected").length,
      edits: events.filter((e) => e.entry.action === "updated").length,
    };
  }, [events]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">
          Audit trail
        </h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Compliance-grade record of every approval, rejection, and field edit across
          your workspace.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={ScrollText}
          label="Total events"
          value={stats.total}
          accent="blue"
        />
        <StatCard
          icon={ShieldCheck}
          label="Approvals"
          value={stats.approvals}
          accent="emerald"
        />
        <StatCard
          icon={ShieldX}
          label="Rejections"
          value={stats.rejections}
          accent="rose"
        />
        <StatCard
          icon={PencilLine}
          label="Field edits"
          value={stats.edits}
          accent="violet"
        />
      </div>

      <div className="card-glass rounded-2xl p-6 ring-soft">
        {loading ? (
          <div className="text-center text-slate-400 py-12 text-sm">
            Aggregating histories from {vendors.length || "all"} vendors...
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-3">
              <ScrollText className="h-5 w-5 text-slate-500" />
            </div>
            <h3 className="text-base font-medium text-white">No events yet</h3>
            <p className="mt-1 text-sm text-slate-400">
              Audit events appear here as vendors are reviewed.
            </p>
          </div>
        ) : (
          <ol className="space-y-3">
            {events.map(({ entry, vendor }) => {
              const Icon = ACTION_ICON[entry.action] ?? PencilLine;
              const style = ACTION_STYLE[entry.action] ?? ACTION_STYLE.updated;
              return (
                <li
                  key={entry.id}
                  className="flex items-start gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4"
                >
                  <div
                    className={
                      "shrink-0 flex h-10 w-10 items-center justify-center rounded-xl border " +
                      style
                    }
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-sm font-medium text-white capitalize">
                        {entry.action}
                      </span>
                      <span className="text-xs text-slate-400">
                        on{" "}
                        <Link
                          to={`/review/${vendor.id}`}
                          className="text-slate-200 hover:text-white"
                        >
                          {vendor.legal_name || "(unnamed)"}
                        </Link>
                      </span>
                      <span className="text-xs text-slate-500">
                        by <span className="text-slate-300">{entry.actor}</span>
                      </span>
                      <span className="ml-auto text-xs text-slate-500 tabular-nums">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {entry.action === "rejected" &&
                      typeof entry.after_json?.["reason"] === "string" && (
                        <div className="mt-2 rounded-lg border border-rose-400/20 bg-rose-500/[0.06] px-3 py-1.5 text-xs text-rose-200">
                          {String(entry.after_json["reason"])}
                        </div>
                      )}
                  </div>
                  <Link
                    to={`/review/${vendor.id}`}
                    className="text-slate-500 hover:text-white"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
