import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  Search,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";
import { api, type Vendor, type VendorStatus } from "../api";
import { vendorConfidence, vendorRisk, type RiskLevel } from "../lib/mockSignals";
import { StatCard } from "../components/StatCard";
import { VendorTable } from "../components/VendorTable";

type SortKey = "newest" | "oldest" | "confidence";
type StatusFilter = VendorStatus | "all";
type RiskFilter = RiskLevel | "all";

export function VendorListPage() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [sort, setSort] = useState<SortKey>("newest");

  useEffect(() => {
    api
      .listVendors()
      .then((vs) => setVendors(vs))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const total = vendors.length;
    const approved = vendors.filter((v) => v.status === "approved").length;
    const pending = vendors.filter((v) => v.status === "pending").length;
    const rejected = vendors.filter((v) => v.status === "rejected").length;
    const avgConfidence = total
      ? Math.round(
          (vendors.reduce((sum, v) => sum + vendorConfidence(v.id), 0) / total) * 100,
        )
      : 0;
    return { total, approved, pending, rejected, avgConfidence };
  }, [vendors]);

  const duplicateEINs = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of vendors) {
      if (v.ein) counts.set(v.ein, (counts.get(v.ein) ?? 0) + 1);
    }
    return new Set(
      Array.from(counts.entries())
        .filter(([, n]) => n > 1)
        .map(([ein]) => ein),
    );
  }, [vendors]);

  const filtered = useMemo(() => {
    let result = [...vendors];
    const s = search.trim().toLowerCase();
    if (s) {
      result = result.filter(
        (v) =>
          v.legal_name.toLowerCase().includes(s) ||
          v.ein.toLowerCase().includes(s),
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((v) => v.status === statusFilter);
    }
    if (riskFilter !== "all") {
      result = result.filter((v) => vendorRisk(v.id).level === riskFilter);
    }
    if (sort === "newest") {
      result.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    } else if (sort === "oldest") {
      result.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    } else {
      result.sort((a, b) => vendorConfidence(b.id) - vendorConfidence(a.id));
    }
    return result;
  }, [vendors, search, statusFilter, riskFilter, sort]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">
          Vendor Intelligence
        </h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Monitor extracted vendors, review statuses, confidence scores, and onboarding
          risk.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard icon={Users} label="Total vendors" value={stats.total} accent="blue" />
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
          icon={XCircle}
          label="Rejected"
          value={stats.rejected}
          accent="rose"
        />
        <StatCard
          icon={Sparkles}
          label="Avg confidence"
          value={`${stats.avgConfidence}%`}
          accent="violet"
        />
      </div>

      <div className="card-glass rounded-2xl p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendor name or EIN..."
            className="w-full rounded-lg border border-white/5 bg-white/[0.025] py-2 pl-10 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-white/20"
          />
        </div>
        <FilterSelect
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as StatusFilter)}
          options={[
            { value: "all", label: "All statuses" },
            { value: "pending", label: "Pending" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
          ]}
        />
        <FilterSelect
          value={riskFilter}
          onChange={(v) => setRiskFilter(v as RiskFilter)}
          options={[
            { value: "all", label: "All risk levels" },
            { value: "low", label: "Low risk" },
            { value: "medium", label: "Medium risk" },
            { value: "high", label: "High risk" },
          ]}
        />
        <FilterSelect
          value={sort}
          onChange={(v) => setSort(v as SortKey)}
          options={[
            { value: "newest", label: "Sort: Newest" },
            { value: "oldest", label: "Sort: Oldest" },
            { value: "confidence", label: "Sort: Confidence" },
          ]}
        />
      </div>

      <VendorTable
        vendors={filtered}
        loading={loading}
        duplicateEINs={duplicateEINs}
        onRowClick={(v) => navigate(`/review/${v.id}`)}
      />
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-white/5 bg-white/[0.025] py-2 pl-3 pr-8 text-sm text-slate-200 focus:outline-none focus:border-white/20"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-ink-900">
          {o.label}
        </option>
      ))}
    </select>
  );
}
