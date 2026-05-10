import type { VendorStatus } from "../api";

const STYLE: Record<VendorStatus, string> = {
  pending: "border-amber-400/25 bg-amber-500/10 text-amber-300",
  approved: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
  rejected: "border-rose-400/25 bg-rose-500/10 text-rose-300",
};

const LABEL: Record<VendorStatus, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
};

export function StatusBadge({
  status,
  size = "md",
}: {
  status: VendorStatus;
  size?: "sm" | "md";
}) {
  const padding = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full border font-medium " +
        STYLE[status] +
        " " +
        padding
      }
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {LABEL[status]}
    </span>
  );
}
