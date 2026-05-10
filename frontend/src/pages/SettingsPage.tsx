import {
  Bell,
  Database,
  KeyRound,
  Shield,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";

const SECTIONS = [
  {
    icon: KeyRound,
    label: "API keys",
    description: "Manage Anthropic API keys and rotate workspace credentials.",
  },
  {
    icon: Workflow,
    label: "Extraction prompts",
    description: "Active prompt version: v3 (tool-use). Configure overrides per doc type.",
  },
  {
    icon: Shield,
    label: "Risk policies",
    description: "Thresholds for confidence, sanctions, and EIN deduplication.",
  },
  {
    icon: Database,
    label: "Data retention",
    description: "Document storage, PII redaction, and audit log retention windows.",
  },
  {
    icon: Bell,
    label: "Notifications",
    description: "Slack, email, and PagerDuty routing for new reviews and risk flags.",
  },
  {
    icon: Users,
    label: "Team & roles",
    description: "Invite reviewers, configure approval thresholds, and SSO.",
  },
];

export function SettingsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">
          Settings
        </h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Workspace configuration, extraction policies, and integrations.
        </p>
      </div>

      <div className="card-glass rounded-2xl p-5 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/15 via-blue-500/8 to-transparent" />
        <div className="relative flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Demo workspace</h2>
            <p className="mt-1 text-sm text-slate-300">
              You're previewing VendorIQ in demo mode. Configuration changes are
              read-only here — connect a workspace to enable.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SECTIONS.map((s) => (
          <div
            key={s.label}
            className="card-glass rounded-2xl p-5 ring-soft transition-colors hover:bg-white/[0.04]"
          >
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg border border-white/10 bg-white/[0.03] flex items-center justify-center text-slate-300">
                <s.icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">{s.label}</h3>
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    Coming soon
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  {s.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
