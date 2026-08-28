import { Plus } from "lucide-react";
import { LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/validation";

export function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="np-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 4 }}>
      <span className="np-eyebrow">{label}</span>
      <span className="np-serif" style={{ fontSize: 34, lineHeight: 1.1, marginTop: 4 }}>{value}</span>
      {sub && <span style={{ fontSize: 12.5, color: "var(--np-fog)" }}>{sub}</span>}
    </div>
  );
}

export function EmptyState({ title, sub, actionLabel, onAction }: {
  title: string; sub: string; actionLabel?: string; onAction?: () => void;
}) {
  return (
    <div className="np-card" style={{ padding: "56px 28px", textAlign: "center" }}>
      <p className="np-serif" style={{ fontSize: 22, marginBottom: 8 }}>{title}</p>
      <p style={{ fontSize: 14, color: "var(--np-fog)", maxWidth: 380, margin: "0 auto 20px" }}>{sub}</p>
      {actionLabel && onAction && (
        <button className="np-btn np-btn-filled" onClick={onAction} style={{ margin: "0 auto" }}>
          <Plus size={15} /> {actionLabel}
        </button>
      )}
    </div>
  );
}

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return <span className="np-status-badge">{LEAD_STATUS_LABELS[status]}</span>;
}

export function formatCurrency(value: number | null) {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDateTimePt(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
