import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Check,
  ChevronLeft,
  FileSearch,
  FileText,
  Highlighter,
  MessageCircleQuestion,
  Sparkles,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { api, type AuditLogEntry, type Vendor } from "../api";
import { fieldConfidence, vendorRisk } from "../lib/mockSignals";
import { AuditTimeline } from "../components/AuditTimeline";
import {
  FieldConfidenceCard,
  type FieldValidation,
} from "../components/FieldConfidenceCard";
import { RiskBadge } from "../components/RiskBadge";
import { StatusBadge } from "../components/StatusBadge";

const ACTOR = "reviewer";

const FIELDS: { key: keyof Vendor; label: string }[] = [
  { key: "legal_name", label: "Legal name" },
  { key: "ein", label: "EIN" },
  { key: "address", label: "Address" },
  { key: "payment_terms", label: "Payment terms" },
  { key: "bank_account_last4", label: "Bank account (last 4)" },
];

type Draft = Record<string, string>;

function vendorToDraft(v: Vendor): Draft {
  const out: Draft = {};
  for (const f of FIELDS) {
    const value = v[f.key];
    out[f.key as string] = value == null ? "" : String(value);
  }
  return out;
}

export function ReviewPage() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const [search] = useSearchParams();
  const docId = search.get("doc");
  const navigate = useNavigate();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [history, setHistory] = useState<AuditLogEntry[]>([]);
  const [draft, setDraft] = useState<Draft>({});
  const [error, setError] = useState<string | null>(null);

  const fieldConfidences = useMemo<Record<string, number>>(() => {
    const out: Record<string, number> = {};
    if (vendorId) {
      for (const f of FIELDS) {
        out[f.key as string] = fieldConfidence(vendorId, f.key as string);
      }
    }
    return out;
  }, [vendorId]);

  const risk = vendorId ? vendorRisk(vendorId) : null;

  async function reload() {
    if (!vendorId) return;
    const v = await api.getVendor(vendorId);
    setVendor(v);
    setDraft(vendorToDraft(v));
    setHistory(await api.getVendorHistory(vendorId));
  }

  useEffect(() => {
    reload().catch((err) =>
      setError(err instanceof Error ? err.message : "Failed to load vendor"),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId]);

  async function handleBlur(field: keyof Vendor) {
    if (!vendor || !vendorId) return;
    const next = draft[field as string];
    const current = vendor[field];
    const currentStr = current == null ? "" : String(current);
    if (next === currentStr) return;
    try {
      await api.patchVendor(vendorId, {
        [field]: next === "" ? null : next,
        actor: ACTOR,
      });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function handleApprove() {
    if (!vendorId) return;
    try {
      await api.approveVendor(vendorId, ACTOR);
      navigate("/vendors");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed");
    }
  }

  async function handleReject() {
    if (!vendorId) return;
    const reason = window.prompt("Rejection reason?");
    if (!reason) return;
    try {
      await api.rejectVendor(vendorId, ACTOR, reason);
      navigate("/vendors");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reject failed");
    }
  }

  const validations = useMemo<Record<string, FieldValidation>>(() => {
    if (!vendor) return {};
    const v: Record<string, FieldValidation> = {};
    v.legal_name = vendor.legal_name
      ? {
          state: "matched",
          message: "Legal name matched against secretary of state records",
        }
      : { state: "missing", message: "Legal name required" };
    v.ein = !vendor.ein
      ? { state: "missing", message: "EIN required" }
      : fieldConfidences.ein < 0.8
      ? { state: "review", message: "EIN needs review · low extraction confidence" }
      : { state: "verified", message: "EIN format valid · IRS reachable" };
    v.address = vendor.address
      ? { state: "verified", message: "Address verified · USPS standardized" }
      : { state: "missing", message: "Address required" };
    v.payment_terms = vendor.payment_terms
      ? { state: "matched", message: "Net terms identified" }
      : { state: "review", message: "No terms supplied · default Net 30 will apply" };
    v.bank_account_last4 = vendor.bank_account_last4
      ? { state: "matched", message: "Bank account verified via Plaid" }
      : { state: "missing", message: "Bank account missing — payments blocked" };
    return v;
  }, [vendor, fieldConfidences]);

  const aiSummary = useMemo(() => {
    if (!vendor || !risk) return "";
    const name = vendor.legal_name || "This vendor";
    if (risk.level === "low") {
      return `${name} appears to be low risk. EIN, legal name, and address were extracted with high confidence and validated against external sources. No prior compliance issues are associated with this entity. Recommended action: approve.`;
    }
    if (risk.level === "medium") {
      return `${name} has moderate risk indicators. Some fields were extracted with lower confidence — review the highlighted entries before approving. No prior sanctions or watchlist hits detected for this EIN.`;
    }
    return `${name} has elevated risk signals: low confidence on critical fields and possible EIN duplication across the workspace. Recommend requesting additional documentation (Certificate of Insurance, beneficial ownership) before approval.`;
  }, [vendor, risk]);

  if (!vendor) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="card-glass rounded-2xl p-12 text-center text-slate-400">
          {error ?? "Loading vendor..."}
        </div>
      </div>
    );
  }

  const isPending = vendor.status === "pending";

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="card-glass rounded-2xl px-5 py-4 flex flex-wrap items-center gap-4">
        <Link
          to="/vendors"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to vendors
        </Link>
        <div className="hidden md:block h-6 w-px bg-white/10" />
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight leading-none">
            {vendor.legal_name || "(unnamed)"}
          </h1>
          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-500">
            <span className="font-mono">vendor_{vendor.id.slice(0, 8)}</span>
            <span>&middot;</span>
            <span>created {new Date(vendor.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={vendor.status} />
          {risk && <RiskBadge level={risk.level} />}
        </div>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={handleReject}
            disabled={!isPending}
            className="rounded-lg border border-white/10 bg-white/[0.025] px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.05] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={handleApprove}
            disabled={!isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-400 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Check className="h-4 w-4" />
            Approve
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="card-glass rounded-2xl overflow-hidden">
            <div className="border-b border-white/5 px-4 py-3 flex items-center gap-3">
              <FileText className="h-4 w-4 text-blue-300" />
              <span className="text-sm font-medium text-white">Source document</span>
              <div className="ml-auto flex items-center gap-3 text-xs text-slate-400">
                <button
                  type="button"
                  className="rounded p-1 hover:bg-white/5 hover:text-white transition-colors"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="tabular-nums">100%</span>
                <button
                  type="button"
                  className="rounded p-1 hover:bg-white/5 hover:text-white transition-colors"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <span className="border-l border-white/10 pl-3 tabular-nums">
                  Page 1 / 1
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded border border-white/10 bg-white/[0.03] px-2 py-1 hover:bg-white/[0.06] hover:text-white transition-colors"
                >
                  <Highlighter className="h-3 w-3" />
                  Highlights
                </button>
              </div>
            </div>
            <div className="h-[62vh] bg-black/40">
              {docId ? (
                <iframe
                  title="Source document"
                  src={api.documentFileUrl(docId)}
                  className="w-full h-full"
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500/20 via-violet-500/20 to-cyan-400/20 border border-white/10 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/10">
                    <FileSearch className="h-7 w-7 text-blue-200" />
                  </div>
                  <h3 className="text-base font-medium text-white">
                    No source document linked
                  </h3>
                  <p className="mt-1 text-sm text-slate-400 max-w-sm">
                    Upload or attach a source document to view extracted evidence.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="card-glass rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg border border-cyan-400/25 bg-cyan-500/10 flex items-center justify-center">
                <Highlighter className="h-3.5 w-3.5 text-cyan-300" />
              </div>
              <h3 className="text-sm font-semibold text-white">Evidence highlights</h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Spans the model used to ground each extracted field.
            </p>
            <ul className="mt-4 space-y-2">
              <EvidenceItem
                color="blue"
                heading="Legal name on line 1"
                value={vendor.legal_name || "—"}
              />
              <EvidenceItem
                color="violet"
                heading="EIN in box 5"
                value={vendor.ein || "—"}
                mono
              />
              <EvidenceItem
                color="cyan"
                heading="Mailing address (lines 5-6)"
                value={vendor.address || "—"}
              />
            </ul>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card-glass rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Extracted fields</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Edit and save on blur. Low-confidence fields are flagged amber.
                </p>
              </div>
              <Sparkles className="h-4 w-4 text-violet-300" />
            </div>
            <div className="mt-4 space-y-3">
              {FIELDS.map((f) => (
                <FieldConfidenceCard
                  key={f.key as string}
                  label={f.label}
                  value={draft[f.key as string] ?? ""}
                  confidence={fieldConfidences[f.key as string] ?? 1}
                  validation={validations[f.key as string]}
                  onChange={(v) =>
                    setDraft({ ...draft, [f.key as string]: v })
                  }
                  onBlur={() => handleBlur(f.key)}
                  disabled={!isPending}
                />
              ))}
            </div>
          </div>

          <div className="card-glass relative overflow-hidden rounded-2xl p-5 ring-soft">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/15 via-blue-500/8 to-transparent" />
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-white">AI Review Summary</h3>
                <span className="ml-auto rounded-full border border-violet-400/25 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-violet-300">
                  Claude
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">{aiSummary}</p>
            </div>
          </div>

          <div className="card-glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white">Decision</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              All actions are recorded in the audit timeline below.
            </p>
            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={handleApprove}
                disabled={!isPending}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-400 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Check className="h-4 w-4" />
                Approve Vendor
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={!isPending}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-200 hover:bg-rose-500/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <X className="h-4 w-4" />
                Reject Vendor
              </button>
              <button
                type="button"
                disabled={!isPending}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.025] px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/[0.05] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <MessageCircleQuestion className="h-4 w-4" />
                Request More Info
              </button>
            </div>
          </div>
        </div>
      </div>

      <AuditTimeline entries={history} />

      {error && (
        <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}
    </div>
  );
}

function EvidenceItem({
  color,
  heading,
  value,
  mono,
}: {
  color: "blue" | "violet" | "cyan";
  heading: string;
  value: string;
  mono?: boolean;
}) {
  const dot =
    color === "blue"
      ? "bg-blue-400"
      : color === "violet"
      ? "bg-violet-400"
      : "bg-cyan-400";
  return (
    <li className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
      <span className={"mt-1.5 h-2 w-2 rounded-full shrink-0 " + dot} />
      <div className="min-w-0">
        <div className="text-sm text-slate-200">{heading}</div>
        <div
          className={
            "mt-0.5 text-xs text-slate-500 truncate " + (mono ? "font-mono" : "")
          }
        >
          {value}
        </div>
      </div>
    </li>
  );
}
