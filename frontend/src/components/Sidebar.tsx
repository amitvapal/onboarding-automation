import { NavLink } from "react-router-dom";
import {
  AlertTriangle,
  Building2,
  ClipboardList,
  LayoutDashboard,
  ScrollText,
  Settings,
  Sparkles,
  Upload,
} from "lucide-react";

const NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/", icon: Upload, label: "Upload", end: true },
  { to: "/vendors", icon: Building2, label: "Vendors" },
  { to: "/reviews", icon: ClipboardList, label: "Reviews" },
  { to: "/risk-flags", icon: AlertTriangle, label: "Risk Flags" },
  { to: "/audit-trail", icon: ScrollText, label: "Audit Trail" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-white/5 bg-ink-900/80 backdrop-blur-xl">
      <div className="px-5 py-5 flex items-center gap-2.5">
        <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 via-violet-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Sparkles className="h-4 w-4 text-white" />
          <div className="absolute inset-0 rounded-xl ring-1 ring-white/20" />
        </div>
        <div>
          <div className="text-base font-semibold text-white tracking-tight leading-none">
            VendorIQ
          </div>
          <div className="mt-1 text-[11px] text-slate-500 leading-none">AI onboarding</div>
        </div>
      </div>

      <nav className="flex-1 mt-2 px-3 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors " +
              (isActive
                ? "bg-gradient-to-r from-blue-500/20 via-violet-500/10 to-transparent text-white border border-white/10"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]")
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-gradient-to-b from-blue-400 to-violet-400" />
                )}
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3">
        <div className="card-glass rounded-xl p-3 ring-soft">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-soft" />
            <div className="text-xs font-medium text-slate-200">Demo workspace</div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">5 of 50 vendors used</div>
          <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-400"
              style={{ width: "10%" }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
