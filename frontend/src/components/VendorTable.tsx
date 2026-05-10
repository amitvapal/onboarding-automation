import { Building2, ChevronRight, Copy } from "lucide-react";
import type { Vendor } from "../api";
import { vendorConfidence, vendorRisk } from "../lib/mockSignals";
import { RiskBadge } from "./RiskBadge";
import { StatusBadge } from "./StatusBadge";

interface VendorTableProps {
  vendors: Vendor[];
  onRowClick: (v: Vendor) => void;
  loading?: boolean;
  duplicateEINs?: Set<string>;
  emptyTitle?: string;
  emptyHint?: string;
}

export function VendorTable({
  vendors,
  onRowClick,
  loading,
  duplicateEINs,
  emptyTitle = "No vendors yet",
  emptyHint = "Upload your first vendor document to get started.",
}: VendorTableProps) {
  if (loading) {
    return (
      <div className="card-glass rounded-2xl p-12">
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 rounded-lg bg-gradient-to-r from-white/[0.02] via-white/[0.05] to-white/[0.02] bg-[length:200%_100%] animate-shimmer"
            />
          ))}
        </div>
      </div>
    );
  }

  if (vendors.length === 0) {
    return (
      <div className="card-glass rounded-2xl p-16 text-center">
        <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/20 via-violet-500/15 to-cyan-400/15 border border-white/10 flex items-center justify-center mb-3">
          <Building2 className="h-5 w-5 text-blue-200" />
        </div>
        <h3 className="text-base font-medium text-white">{emptyTitle}</h3>
        <p className="mt-1 text-sm text-slate-400">{emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="card-glass rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Vendor
              </th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                EIN
              </th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Status
              </th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Risk
              </th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Confidence
              </th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Created
              </th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => {
              const risk = vendorRisk(v.id);
              const conf = vendorConfidence(v.id);
              const isDup = duplicateEINs?.has(v.ein) ?? false;
              const initials = (v.legal_name || "?")
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase() || "?";
              return (
                <tr
                  key={v.id}
                  onClick={() => onRowClick(v)}
                  className="group border-b border-white/5 last:border-0 cursor-pointer transition-colors hover:bg-white/[0.025]"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500/25 via-violet-500/20 to-cyan-400/20 border border-white/10 flex items-center justify-center text-xs font-semibold text-blue-100">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-white truncate">
                          {v.legal_name || "(unnamed)"}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {v.address || "—"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-300">
                        {v.ein || "—"}
                      </span>
                      {isDup && (
                        <span
                          title="Duplicate EIN detected"
                          className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-300"
                        >
                          <Copy className="h-2.5 w-2.5" />
                          dup
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={v.status} size="sm" />
                  </td>
                  <td className="px-5 py-4">
                    <RiskBadge level={risk.level} size="sm" />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-24 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-400"
                          style={{ width: `${Math.round(conf * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-300 tabular-nums">
                        {Math.round(conf * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-400 tabular-nums">
                    {new Date(v.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <ChevronRight className="h-4 w-4 text-slate-600 inline transition-transform group-hover:translate-x-0.5 group-hover:text-slate-300" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
