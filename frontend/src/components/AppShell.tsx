import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";

export function AppShell() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-950 text-slate-200">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-blue-600/25 blur-[120px] animate-blob" />
        <div className="absolute top-1/3 -right-40 h-[26rem] w-[26rem] rounded-full bg-violet-600/25 blur-[120px] animate-blob [animation-delay:-7s]" />
        <div className="absolute bottom-[-6rem] left-1/3 h-[24rem] w-[24rem] rounded-full bg-cyan-500/15 blur-[120px] animate-blob [animation-delay:-13s]" />
      </div>
      <div className="pointer-events-none fixed inset-0 -z-10 bg-grid opacity-50" />

      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex flex-1 min-w-0 flex-col">
          <TopNav />
          <main className="flex-1 px-6 py-8 lg:px-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
