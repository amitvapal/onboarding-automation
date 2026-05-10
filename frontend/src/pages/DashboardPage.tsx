import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
  Upload as UploadIcon,
  Users,
} from "lucide-react";
import { api, type Vendor } from "../api";
import { vendorConfidence, vendorRisk } from "../lib/mockSignals";
import { StatCard } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import { RiskBadge } from "../components/RiskBadge";

export function DashboardPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    api.listVendors().then(setVendors).catch(() => undefined);
  }, []);

  const stats = useMemo(() => {
    const total = vendors.length;
    const approved = vendors.filter((v) => v.status === "approved").length;
    const pending = vendors.filter((v) => v.status === "pending").length;
    const avgConf = total
      ? Math.round(
          (vendors.reduce((sum, v) => sum + vendorConfidence(v.id), 0) / total) * 100,
        )
      : 0;
    return { total, approved, pending, avgConf };
  }, [vendors]);

  const recent = useMemo(() => {
    return [...vendors]
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
      .slice(0, 5);
  }, [vendors]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">
          Welcome back
        </h1>
        <p className="mt-2 text-slate-400 max-w-2xl">
          Here's a snapshot of your vendor onboarding pipeline today.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Vendors" value={stats.total} accent="blue" />
        <StatCard
          icon={CheckCircle2}
          label="Approved"
          value={stats.approved}
          accent="emerald"
        />
        <StatCard
          icon={Clock}
          label="Pending review"
          value={stats.pending}
          accent="amber"
        />
        <StatCard
          icon={BadgeCheck}
          label="Avg confidence"
          value={`${stats.avgConf}%`}
          accent="violet"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-glass rounded-2xl p-5 ring-soft">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Recent vendors</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Latest 5 onboarded entities
              </p>
            </div>
            <Link
              to="/vendors"
              className="text-xs text-blue-300 hover:text-blue-200 inline-flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="mt-4 space-y-2">
            {recent.length === 0 && (
              <li className="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center text-sm text-slate-400">
                No vendors yet.
                <Link
                  to="/"
                  className="ml-1 text-blue-300 hover:text-blue-200 inline-flex items-center gap-1"
                >
                  Upload one <ArrowRight className="h-3 w-3" />
                </Link>
              </li>
            )}
            {recent.map((v) => (
              <li
                key={v.id}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
              >
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500/25 via-violet-500/20 to-cyan-400/20 border border-white/10 flex items-center justify-center text-xs font-semibold text-blue-100">
                  {(v.legal_name || "?").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {v.legal_name || "(unnamed)"}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {v.ein || "no EIN"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={v.status} size="sm" />
                  <RiskBadge level={vendorRisk(v.id).level} size="sm" />
                </div>
                <Link
                  to={`/review/${v.id}`}
                  className="text-slate-500 hover:text-white"
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <Link
            to="/"
            className="card-glass rounded-2xl p-5 ring-soft block hover:bg-white/[0.04] transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <UploadIcon className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-white">Onboard a vendor</h3>
            </div>
            <p className="text-xs text-slate-400">
              Upload a W-9, contract, or invoice and let Claude extract the fields.
            </p>
          </Link>
          <Link
            to="/risk-flags"
            className="card-glass rounded-2xl p-5 ring-soft block hover:bg-white/[0.04] transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-white">Review risk flags</h3>
            </div>
            <p className="text-xs text-slate-400">
              Vendors with elevated signals waiting on additional documentation.
            </p>
          </Link>
          <Link
            to="/vendors"
            className="card-glass rounded-2xl p-5 ring-soft block hover:bg-white/[0.04] transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-white">Vendor directory</h3>
            </div>
            <p className="text-xs text-slate-400">
              Browse, search, and filter every vendor in this workspace.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
