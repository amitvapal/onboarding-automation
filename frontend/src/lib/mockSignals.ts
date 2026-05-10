// Deterministic, demo-only confidence and risk signals.
// Replace with real model output in v2 — UI does not depend on the source.

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export type RiskLevel = "low" | "medium" | "high";

export interface RiskSignal {
  score: number;
  level: RiskLevel;
}

export function vendorRisk(id: string): RiskSignal {
  const score = (hash(id + ":risk") % 100) / 100;
  const level: RiskLevel = score < 0.4 ? "low" : score < 0.78 ? "medium" : "high";
  return { score, level };
}

export function vendorConfidence(id: string): number {
  return ((hash(id + ":conf") % 35) + 65) / 100; // 0.65 - 0.99
}

export function fieldConfidence(id: string, field: string): number {
  return ((hash(id + ":" + field) % 45) + 55) / 100; // 0.55 - 0.99
}
