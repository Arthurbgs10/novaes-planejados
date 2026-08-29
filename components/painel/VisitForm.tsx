"use client";

import { useEffect, useRef, useState } from "react";
import { X, Check, Trash2 } from "lucide-react";
import type { LeadRecord, VisitRecord } from "@/lib/types";
import { VISIT_STATUS_LABELS, VISIT_STATUS_VALUES, VISIT_TYPE_LABELS, VISIT_TYPE_VALUES } from "@/lib/validation";
import { createVisitAction, updateVisitAction, deleteVisitAction } from "@/app/painel/actions";

function toDatetimeLocal(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface VisitFormValues {
  leadId: string;
  type: (typeof VISIT_TYPE_VALUES)[number];
  scheduledAt: string;
  status: (typeof VISIT_STATUS_VALUES)[number];
  notes: string;
}

export default function VisitForm({ initial, leads, prefillDate, onCancel, onSaved, onDeleted }: {
  initial: VisitRecord | null;
  leads: LeadRecord[];
  prefillDate?: string;
  onCancel: () => void;
  onSaved: (visit: VisitRecord) => void;
  onDeleted: (id: string) => void;
}) {
  const isNew = !initial?.id;
  const [form, setForm] = useState<VisitFormValues>({
    leadId: initial?.lead_id || "",
    type: initial?.type || "medicao",
    scheduledAt: initial ? toDatetimeLocal(initial.scheduled_at) : prefillDate ? `${prefillDate}T09:00` : "",
    status: initial?.status || "agendada",
    notes: initial?.notes || "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"idle" | "saving" | "deleting">("idle");
  const firstFieldRef = useRef<HTMLSelectElement>(null);

  useEffect(() => { firstFieldRef.current?.focus(); }, []);
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onCancel(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  function set<K extends keyof VisitFormValues>(field: K, value: VisitFormValues[K]) {
    setForm((f) => ({ ...f, [field]: value }));
    if (error) setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.leadId) { setError("Selecione um lead."); return; }
    if (!form.scheduledAt) { setError("Escolha data e hora."); return; }
    setBusy("saving");
    // Converte pro UTC ainda aqui no navegador (que conhece o fuso horário
    // real de quem está preenchendo). Se isso rodasse só na Server Action,
    // ela executaria no servidor da Vercel (fuso UTC), interpretando
    // "09:00" como 09:00 UTC em vez de 09:00 no Brasil — um erro de 3h.
    const scheduledAtIso = new Date(form.scheduledAt).toISOString();
    const payload = { ...form, scheduledAt: scheduledAtIso };
    const result = isNew ? await createVisitAction(payload) : await updateVisitAction(initial!.id, payload);
    setBusy("idle");
    if (!result.ok) { setError(result.error); return; }
    onSaved(result.data);
  }

  async function handleDelete() {
    if (!initial?.id) return;
    setBusy("deleting");
    const result = await deleteVisitAction(initial.id);
    setBusy("idle");
    if (!result.ok) { setError(result.error); return; }
    onDeleted(initial.id);
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }} role="dialog" aria-modal="true">
      <div onClick={onCancel} style={{ position: "absolute", inset: 0, background: "rgba(42,42,42,.35)" }} />
      <form onSubmit={handleSubmit} className="np-card" style={{ position: "relative", width: "min(420px, 92vw)", padding: 26, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <p className="np-serif" style={{ fontSize: 20 }}>{isNew ? "Nova visita" : "Editar visita"}</p>
          <button type="button" className="np-btn np-btn-ghost" style={{ border: "none", padding: 6 }} onClick={onCancel} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="np-label" htmlFor="leadId">Lead</label>
          <select ref={firstFieldRef} id="leadId" className="np-input" value={form.leadId} onChange={(e) => set("leadId", e.target.value)}>
            <option value="">Selecione…</option>
            {leads.map((l) => <option key={l.id} value={l.id}>{l.name}{l.phone ? ` — ${l.phone}` : ""}</option>)}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label className="np-label np-label-pair" htmlFor="type">Tipo</label>
            <select id="type" className="np-input" value={form.type} onChange={(e) => set("type", e.target.value as VisitFormValues["type"])}>
              {VISIT_TYPE_VALUES.map((t) => <option key={t} value={t}>{VISIT_TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <div>
            <label className="np-label np-label-pair" htmlFor="status">Status</label>
            <select id="status" className="np-input" value={form.status} onChange={(e) => set("status", e.target.value as VisitFormValues["status"])}>
              {VISIT_STATUS_VALUES.map((s) => <option key={s} value={s}>{VISIT_STATUS_LABELS[s]}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="np-label" htmlFor="scheduledAt">Data e hora</label>
          <input id="scheduledAt" type="datetime-local" className="np-input" value={form.scheduledAt} onChange={(e) => set("scheduledAt", e.target.value)} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label className="np-label" htmlFor="notes">Notas</label>
          <textarea id="notes" className="np-input" rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>

        {error && <p style={{ fontSize: 12, color: "#b3261e", marginBottom: 14 }}>{error}</p>}

        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          {!isNew ? (
            <button type="button" className="np-btn np-btn-danger" onClick={handleDelete} disabled={busy !== "idle"}>
              <Trash2 size={14} /> {busy === "deleting" ? "Excluindo…" : "Excluir"}
            </button>
          ) : <span />}
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="np-btn np-btn-ghost np-hairline" style={{ border: "1px solid var(--np-line)" }} onClick={onCancel} disabled={busy !== "idle"}>Cancelar</button>
            <button type="submit" className="np-btn np-btn-filled" disabled={busy !== "idle"}>
              <Check size={14} /> {busy === "saving" ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
