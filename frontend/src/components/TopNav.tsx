import { Bell, Search } from "lucide-react";

export function TopNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-ink-950/70 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-6 lg:px-10 py-3">
        <div className="relative flex-1 max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="search"
            placeholder="Search vendors, documents, audit events..."
            className="w-full rounded-lg border border-white/5 bg-white/[0.025] py-2 pl-10 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-white/20 focus:bg-white/[0.04] transition-colors"
          />
          <kbd className="hidden md:inline-block absolute right-2 top-1/2 -translate-y-1/2 rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
            &#8984;K
          </kbd>
        </div>

        <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
          Demo
        </span>

        <button
          type="button"
          className="relative rounded-lg p-2 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-blue-400" />
        </button>

        <div className="flex items-center gap-2.5 pl-2 border-l border-white/5">
          <div className="hidden sm:block text-right">
            <div className="text-xs font-medium text-slate-200 leading-none">Amit Patel</div>
            <div className="mt-1 text-[11px] text-slate-500 leading-none">Compliance Reviewer</div>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-xs font-semibold text-white shadow-lg shadow-violet-500/20">
            AP
          </div>
        </div>
      </div>
    </header>
  );
}
