import { useEffect, useMemo, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BadgeCheck,
  Clock,
  Database,
  FileCheck,
  FileText,
  Inbox,
  Layers,
  Receipt,
  ScanText,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";
import { api, type DocType } from "../api";
import { vendorRisk } from "../lib/mockSignals";
import { StatCard } from "../components/StatCard";
import { UploadDropzone } from "../components/UploadDropzone";
import {
  PipelineTimeline,
  type PipelineStep,
  type PipelineStatus,
} from "../components/PipelineTimeline";

interface DocCard {
  key: string;
  apiValue: DocType;
  label: string;
  description: string;
  icon: typeof Receipt;
}

const DOC_CARDS: DocCard[] = [
  {
    key: "invoice",
    apiValue: "invoice",
    label: "Invoice",
    description: "Vendor invoices, line items, payment terms",
    icon: Receipt,
  },
  {
    key: "w9",
    apiValue: "w9",
    label: "W-9",
    description: "Tax identity, EIN, legal name",
    icon: FileText,
  },
  {
    key: "msa",
    apiValue: "msa",
    label: "Contract",
    description: "MSA, SOW, governing terms",
    icon: FileCheck,
  },
  {
    key: "coi",
    apiValue: "msa",
    label: "Certificate of Insurance",
    description: "Coverage, expiration, policy numbers",
    icon: ShieldCheck,
  },
];

type Stage = "idle" | "upload" | "extract" | "create" | "done";

function toVendorPayload(
  apiType: DocType,
  extracted: Record<string, unknown>,
): Record<string, unknown> {
  const str = (k: string) =>
    typeof extracted[k] === "string" ? (extracted[k] as string) : "";
  if (apiType === "w9") {
    return {
      legal_name: str("legal_name"),
      ein: str("ein"),
      address: str("address"),
      payment_terms: null,
      bank_account_last4: null,
    };
  }
  if (apiType === "msa") {
    const days = extracted["payment_terms_days"];
    return {
      legal_name: str("vendor_name"),
      ein: "",
      address: "",
      payment_terms: typeof days === "number" ? `Net ${days}` : null,
      bank_account_last4: null,
    };
  }
  return {
    legal_name: str("vendor_name"),
    ein: "",
    address: "",
    payment_terms: null,
    bank_account_last4: null,
  };
}

function stageLabel(stage: Stage): string {
  switch (stage) {
    case "upload":
      return "Uploading document...";
    case "extract":
      return "Extracting fields with Claude...";
    case "create":
      return "Creating vendor record...";
    case "done":
      return "Complete";
    default:
      return "Upload and Extract with AI";
  }
}

export function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [docKey, setDocKey] = useState<string>("w9");
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState({
    vendors: 128,
    accuracy: 94,
    pending: 12,
    riskFlags: 3,
  });

  useEffect(() => {
    api
      .listVendors()
      .then((vs) => {
        const pending = vs.filter((v) => v.status === "pending").length;
        const flags = vs.filter((v) => vendorRisk(v.id).level === "high").length;
        setStats((prev) => ({
          vendors: 128 + vs.length,
          accuracy: prev.accuracy,
          pending: 12 + pending,
          riskFlags: 3 + flags,
        }));
      })
      .catch(() => undefined);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    const card = DOC_CARDS.find((c) => c.key === docKey);
    if (!card) return;

    setError(null);
    try {
      setStage("upload");
      const doc = await api.uploadDocument(file, card.apiValue);

      setStage("extract");
      const extracted = await api.extractDocument(doc.id);

      setStage("create");
      const vendor = await api.createVendor(toVendorPayload(card.apiValue, extracted));

      setStage("done");
      navigate(`/review/${vendor.id}?doc=${doc.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStage("idle");
    }
  }

  const pipeline = useMemo<PipelineStep[]>(() => {
    const base: Array<Omit<PipelineStep, "status">> = [
      { label: "Upload received", icon: Inbox, description: "Document accepted" },
      { label: "OCR processing", icon: ScanText, description: "Layout + text extraction" },
      { label: "Field extraction", icon: Layers, description: "Claude tool-use schema" },
      { label: "Vendor matching", icon: Database, description: "EIN deduplication" },
      { label: "Risk validation", icon: ShieldAlert, description: "Sanctions + watchlists" },
      { label: "Human review", icon: UserCheck, description: "Reviewer approval" },
    ];

    function statusFor(idx: number): PipelineStatus {
      const order: Stage[] = ["idle", "upload", "extract", "create", "done"];
      const stageIdx = order.indexOf(stage);
      // upload -> step 0 active
      // extract -> steps 0 done, 1+2 active wave; we'll keep 1 done, 2 active
      // create -> steps 0..2 done, 3 active
      // done -> all done
      if (stage === "idle") return "queued";
      if (stage === "upload") return idx === 0 ? "active" : "queued";
      if (stage === "extract") {
        if (idx <= 1) return "done";
        if (idx === 2) return "active";
        return "queued";
      }
      if (stage === "create") {
        if (idx <= 2) return "done";
        if (idx === 3) return "active";
        return "queued";
      }
      // done
      if (idx <= 4) return "done";
      return stageIdx >= 4 ? "active" : "queued";
    }

    return base.map((step, i) => ({ ...step, status: statusFor(i) }));
  }, [stage]);

  const busy = stage !== "idle" && stage !== "done";

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.025] px-3 py-1 text-xs text-slate-300">
          <Sparkles className="h-3 w-3 text-violet-300" />
          AI Document Intake
        </div>
        <h1 className="mt-3 text-3xl md:text-4xl font-semibold text-white tracking-tight">
          AI Vendor Onboarding
        </h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Upload vendor documents and automatically extract, validate, and route vendor
          data for review.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Vendors onboarded"
          value={stats.vendors}
          accent="blue"
          delta={{ value: "+12 this month", positive: true }}
        />
        <StatCard
          icon={BadgeCheck}
          label="Extraction accuracy"
          value={`${stats.accuracy}%`}
          accent="emerald"
          delta={{ value: "+2.1% vs prompt v2", positive: true }}
        />
        <StatCard
          icon={Clock}
          label="Pending reviews"
          value={stats.pending}
          accent="amber"
        />
        <StatCard
          icon={AlertTriangle}
          label="Risk flags"
          value={stats.riskFlags}
          accent="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-white">Document type</h2>
            <p className="mt-1 text-xs text-slate-500">
              Routes the file to the right extraction schema and prompt template.
            </p>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
              {DOC_CARDS.map((card) => {
                const active = docKey === card.key;
                const Icon = card.icon;
                return (
                  <button
                    key={card.key}
                    type="button"
                    onClick={() => setDocKey(card.key)}
                    className={
                      "group relative rounded-xl border p-4 text-left transition-all overflow-hidden " +
                      (active
                        ? "border-blue-400/50 bg-gradient-to-br from-blue-500/15 via-violet-500/10 to-transparent shadow-lg shadow-blue-500/10"
                        : "border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]")
                    }
                  >
                    <div
                      className={
                        "h-9 w-9 rounded-lg border flex items-center justify-center mb-3 transition-colors " +
                        (active
                          ? "border-blue-400/40 bg-blue-500/15 text-blue-200"
                          : "border-white/10 bg-white/[0.02] text-slate-400 group-hover:text-slate-200")
                      }
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div
                      className={
                        "text-sm font-medium " +
                        (active ? "text-white" : "text-slate-200")
                      }
                    >
                      {card.label}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500 leading-snug">
                      {card.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white">Document</h2>
            <p className="mt-1 text-xs text-slate-500">
              PDF only. Files are processed in your environment.
            </p>
            <div className="mt-3">
              <UploadDropzone file={file} onFile={setFile} disabled={busy} />
            </div>
          </div>

          <button
            type="submit"
            disabled={!file || busy}
            className="group relative w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-400 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-blue-500/40 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles className="h-4 w-4" />
            {stageLabel(stage)}
          </button>

          {error && (
            <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {error}
            </div>
          )}
        </form>

        <div className="lg:col-span-1">
          <PipelineTimeline steps={pipeline} />
        </div>
      </div>
    </div>
  );
}
