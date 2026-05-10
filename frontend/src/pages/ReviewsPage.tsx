import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import { api, type Vendor } from "../api";
import { StatCard } from "../components/StatCard";
import { VendorTable } from "../components/VendorTable";

export function ReviewsPage() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listVendors("pending")
      .then((vs) => setVendors(vs))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">
          Reviews queue
        </h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Vendors awaiting human approval. Edit fields, run validations, then approve or
          reject.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          icon={Clock}
          label="Pending review"
          value={vendors.length}
          accent="amber"
        />
      </div>

      <VendorTable
        vendors={vendors}
        loading={loading}
        onRowClick={(v) => navigate(`/review/${v.id}`)}
        emptyTitle="Inbox zero"
        emptyHint="No vendors are waiting for review."
      />
    </div>
  );
}
