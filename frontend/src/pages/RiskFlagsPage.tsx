import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, ShieldAlert } from "lucide-react";
import { api, type Vendor } from "../api";
import { vendorConfidence, vendorRisk } from "../lib/mockSignals";
import { StatCard } from "../components/StatCard";
import { RiskBadge } from "../components/RiskBadge";
import { StatusBadge } from "../components/StatusBadge";

interface FlaggedVendor {
  vendor: Vendor;
  confidence: number;
}

export function RiskFlagsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listVendors()
      .then(setVendors)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const flagged: FlaggedVendor[] = useMemo(() => {
    return vendors
      .filter((v) => vendorRisk(v.id).level === "high")
      .map((v) => ({ vendor: v, confidence: vendorConfidence(v.id) }))
      .sort((a, b) => a.confidence - b.confidence);
  }, [vendors]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">
          Risk flags
        </h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Vendors with elevated risk signals from extraction, EIN duplication, or
          watchlist matches.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          icon={ShieldAlert}
          label="High-risk vendors"
          value={flagged.length}
          accent="rose"
        />
        <StatCard
          icon={AlertTriangle}
          label="Sanctions hits (30d)"
          value={0}
          accent="amber"
        />
        <StatCard
          icon={AlertTriangle}
          label="EIN collisions"
          value={
            vendors.filter((v) => {
              const seen = vendors.filter((o) => o.ein === v.ein && v.ein);
              return seen.length > 1;
            }).length
          }
          accent="violet"
        />
      </div>

      {loading ? (
        <div className="card-glass rounded-2xl p-12 text-center text-slate-400">
          Loading risk signals...
        </div>
      ) : flagged.length === 0 ? (
        <div className="card-glass rounded-2xl p-16 text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-400/20 border border-white/10 flex items-center justify-center mb-3">
            <ShieldAlert className="h-5 w-5 text-emerald-300" />
          </div>
          <h3 className="text-base font-medium text-white">All clear</h3>
          <p className="mt-1 text-sm text-slate-400">
            No vendors are currently flagged as high risk.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {flagged.map(({ vendor, confidence }) => (
            <li key={vendor.id}>
              <Link
                to={`/review/${vendor.id}`}
                className="card-glass rounded-2xl p-5 ring-soft block transition-colors hover:bg-white/[0.04]"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-500/25 to-amber-500/20 border border-rose-400/20 flex items-center justify-center shrink-0">
                    <ShieldAlert className="h-5 w-5 text-rose-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-white truncate">
                        {vendor.legal_name || "(unnamed)"}
                      </h3>
                      <RiskBadge level="high" size="sm" />
                      <StatusBadge status={vendor.status} size="sm" />
                    </div>
                    <div className="mt-1 text-xs text-slate-500 font-mono truncate">
                      {vendor.ein || "no EIN"}
                    </div>
                    <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                      Extraction confidence{" "}
                      <span className="text-rose-300 font-semibold tabular-nums">
                        {Math.round(confidence * 100)}%
                      </span>
                      . Recommend additional documentation before approval.
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-500" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
