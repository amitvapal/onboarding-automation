const API = "/api";

export type DocType = "w9" | "msa" | "invoice";
export type VendorStatus = "pending" | "approved" | "rejected";

export interface DocumentRow {
  id: string;
  filename: string;
  doc_type: DocType;
  uploaded_at: string;
  file_path: string;
}

export interface Vendor {
  id: string;
  legal_name: string;
  ein: string;
  address: string;
  payment_terms: string | null;
  bank_account_last4: string | null;
  status: VendorStatus;
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
}

export interface AuditLogEntry {
  id: string;
  vendor_id: string;
  action: string;
  before_json: Record<string, unknown> | null;
  after_json: Record<string, unknown> | null;
  actor: string;
  timestamp: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? `: ${text}` : ""}`);
  }
  return res.json() as Promise<T>;
}

function jsonRequest<T>(path: string, method: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export const api = {
  uploadDocument(file: File, docType: DocType): Promise<DocumentRow> {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("doc_type", docType);
    return request<DocumentRow>("/documents", { method: "POST", body: fd });
  },

  extractDocument(docId: string, version: string = "v3"): Promise<Record<string, unknown>> {
    return request<Record<string, unknown>>(
      `/documents/${docId}/extract?prompt_version=${version}`,
      { method: "POST" },
    );
  },

  createVendor(payload: Record<string, unknown>): Promise<Vendor> {
    return jsonRequest<Vendor>("/vendors", "POST", payload);
  },

  listVendors(status?: VendorStatus): Promise<Vendor[]> {
    const q = status ? `?status=${status}` : "";
    return request<Vendor[]>(`/vendors${q}`);
  },

  getVendor(id: string): Promise<Vendor> {
    return request<Vendor>(`/vendors/${id}`);
  },

  patchVendor(id: string, payload: Record<string, unknown>): Promise<Vendor> {
    return jsonRequest<Vendor>(`/vendors/${id}`, "PATCH", payload);
  },

  approveVendor(id: string, actor: string): Promise<Vendor> {
    return jsonRequest<Vendor>(`/vendors/${id}/approve`, "POST", { actor });
  },

  rejectVendor(id: string, actor: string, reason: string): Promise<Vendor> {
    return jsonRequest<Vendor>(`/vendors/${id}/reject`, "POST", { actor, reason });
  },

  getVendorHistory(id: string): Promise<AuditLogEntry[]> {
    return request<AuditLogEntry[]>(`/vendors/${id}/history`);
  },

  documentFileUrl(docId: string): string {
    return `${API}/documents/${docId}/file`;
  },
};
