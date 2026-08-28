"use client";

import { useEffect, useRef, useState } from "react";
import { X, Check, Trash2, Phone } from "lucide-react";
import type { LeadRecord } from "@/lib/types";
import { ENVIRONMENT_OPTIONS, LEAD_STATUS_LABELS, LEAD_STATUS_VALUES } from "@/lib/validation";
import { createLeadAction, updateLeadAction, deleteLeadAction } from "@/app/painel/actions";

interface LeadFormValues {
  name: string;
  phone: string;
  address: string;
  propertyType: string;
  environments: string[];
  applianceGeladeira: string;
  applianceFogao: string;
  applianceMicroondas: string;
  applianceCoifa: string;
  applianceMaquina: string;
  applianceCama: string;
  designStyle: string;
  colorPreference: string;
  wantsTechnicalVisit: boolean;
  status: (typeof LEAD_STATUS_VALUES)[number];
  budgetValue: string;
  paymentMethod: string;
  installments: string;
  amountReceived: string;
  notes: string;
}

function recordToFormValues(record?: LeadRecord | null): LeadFormValues {
  return {
    name: record?.name || "",
    phone: record?.phone || "",
    address: record?.address || "",
    propertyType: record?.property_type || "",
    environments: record?.environments || [],
    applianceGeladeira: record?.appliance_details?.geladeira || "",
    applianceFogao: record?.appliance_details?.fogao || "",
    applianceMicroondas: record?.appliance_details?.microondas || "",
    applianceCoifa: record?.appliance_details?.coifa || "",
    applianceMaquina: record?.appliance_details?.maquina || "",
    applianceCama: record?.appliance_details?.cama || "",
    designStyle: record?.design_style || "",
    colorPreference: record?.color_preference || "",
    wantsTechnicalVisit: record?.wants_technical_visit || false,
    status: record?.status || "lead",
    budgetValue: record?.budget_value != null ? String(record.budget_value) : "",
    paymentMethod: record?.payment_method || "",
    installments: record?.installments != null ? String(record.installments) : "",
    amountReceived: record?.amount_received != null ? String(record.amount_received) : "0",
    notes: record?.notes || "",
  };
}

export default function LeadForm({ initial, onCancel, onSaved, onDeleted }: {
  initial: LeadRecord | null;
  onCancel: () => void;
  onSaved: (lead: LeadRecord) => void;
  onDeleted: (id: string) => void;
}) {
  const isNew = !initial?.id;
  const [form, setForm] = useState<LeadFormValues>(() => recordToFormValues(initial));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"idle" | "saving" | "deleting">("idle");
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => { firstFieldRef.current?.focus(); }, []);
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onCancel(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  function set<K extends keyof LeadFormValues>(field: K, value: LeadFormValues[K]) {
    setForm((f) => ({ ...f, [field]: value }));
    if (error) setError("");
  }

  function toggleEnv(env: string) {
    setForm((f) => ({
      ...f,
      environments: f.environments.includes(env) ? f.environments.filter((e) => e !== env) : [...f.environments, env],
    }));
  }

  const hasCozinha = form.environments.includes("Cozinha");
  const hasQuarto = form.environments.includes("Quarto");
  const hasLavanderia = form.environments.includes("Lavanderia");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Preencha o nome do lead.");
      return;
    }
    setBusy("saving");
    const result = isNew ? await createLeadAction(form) : await updateLeadAction(initial!.id, form);
    setBusy("idle");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSaved(result.data);
  }

  async function handleDelete() {
    if (!initial?.id) return;
    setBusy("deleting");
    const result = await deleteLeadAction(initial.id);
    setBusy("idle");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onDeleted(initial.id);
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", justifyContent: "flex-end" }} role="dialog" aria-modal="true">
      <div onClick={onCancel} style={{ position: "absolute", inset: 0, background: "rgba(42,42,42,.35)" }} />
      <form
        onSubmit={handleSubmit}
        className="np-scrollbar"
        style={{
          position: "relative", width: "min(460px, 100vw)", height: "100%",
          background: "var(--np-paper)", borderLeft: "1px solid var(--np-line)",
          padding: "28px 26px 100px", overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <p className="np-serif" style={{ fontSize: 22 }}>{isNew ? "Novo lead" : "Editar lead"}</p>
          <button type="button" className="np-btn np-btn-ghost" style={{ border: "none", padding: 6 }} onClick={onCancel} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="np-label" htmlFor="name">Nome</label>
          <input ref={firstFieldRef} id="name" className="np-input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Nome completo" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
          <div>
            <label className="np-label np-label-pair" htmlFor="phone">WhatsApp</label>
            <input id="phone" className="np-input" value={form.phone} onChange={(e) => set("phone", e.target.value.replace(/[^\d]/g, ""))} placeholder="5521999990000" />
          </div>
          <div>
            <label className="np-label np-label-pair" htmlFor="propertyType">Tipo de imóvel</label>
            <select id="propertyType" className="np-input" value={form.propertyType} onChange={(e) => set("propertyType", e.target.value)}>
              <option value="">—</option>
              <option value="Casa">Casa</option>
              <option value="Apartamento">Apartamento</option>
            </select>
          </div>
        </div>

        {form.phone && (
          <div style={{ marginBottom: 16 }}>
            <a href={`https://wa.me/${form.phone}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--np-fog)" }}>
              <Phone size={13} /> Abrir WhatsApp
            </a>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label className="np-label" htmlFor="address">Endereço</label>
          <input id="address" className="np-input" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Rua, número, bairro, cidade" />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="np-label">Ambientes</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {ENVIRONMENT_OPTIONS.map((env) => (
              <button
                type="button" key={env}
                className={`np-chip${form.environments.includes(env) ? " selected" : ""}`}
                onClick={() => toggleEnv(env)}
              >
                {env}
              </button>
            ))}
          </div>
        </div>

        {(hasCozinha || hasQuarto || hasLavanderia) && (
          <div style={{ marginBottom: 16, padding: 14, background: "var(--np-green-bg)", borderRadius: 10, border: "1px solid var(--np-green-muted)" }}>
            <p className="np-eyebrow" style={{ marginBottom: 10 }}>Equipamentos</p>
            {hasCozinha && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <input className="np-input" value={form.applianceGeladeira} onChange={(e) => set("applianceGeladeira", e.target.value)} placeholder="Geladeira" />
                <input className="np-input" value={form.applianceFogao} onChange={(e) => set("applianceFogao", e.target.value)} placeholder="Fogão/Cooktop" />
                <input className="np-input" value={form.applianceMicroondas} onChange={(e) => set("applianceMicroondas", e.target.value)} placeholder="Microondas" />
                <input className="np-input" value={form.applianceCoifa} onChange={(e) => set("applianceCoifa", e.target.value)} placeholder="Coifa/Depurador" />
              </div>
            )}
            {hasQuarto && (
              <input className="np-input" style={{ marginBottom: 10 }} value={form.applianceCama} onChange={(e) => set("applianceCama", e.target.value)} placeholder="Tamanho da cama" />
            )}
            {hasLavanderia && (
              <input className="np-input" value={form.applianceMaquina} onChange={(e) => set("applianceMaquina", e.target.value)} placeholder="Máquina de lavar" />
            )}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
          <div>
            <label className="np-label np-label-pair" htmlFor="designStyle">Estilo</label>
            <input id="designStyle" className="np-input" value={form.designStyle} onChange={(e) => set("designStyle", e.target.value)} />
          </div>
          <div>
            <label className="np-label np-label-pair" htmlFor="colorPreference">Cor preferida</label>
            <input id="colorPreference" className="np-input" value={form.colorPreference} onChange={(e) => set("colorPreference", e.target.value)} />
          </div>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 13.5 }}>
          <input type="checkbox" checked={form.wantsTechnicalVisit} onChange={(e) => set("wantsTechnicalVisit", e.target.checked)} />
          Quer visita técnica
        </label>

        <div style={{ marginBottom: 16 }}>
          <label className="np-label">Status</label>
          <select className="np-input" value={form.status} onChange={(e) => set("status", e.target.value as LeadFormValues["status"])}>
            {LEAD_STATUS_VALUES.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
          </select>
        </div>

        <p className="np-eyebrow" style={{ marginBottom: 10 }}>Financeiro</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
          <div>
            <label className="np-label np-label-pair" htmlFor="budgetValue">Valor do orçamento (R$)</label>
            <input id="budgetValue" type="number" min="0" step="0.01" className="np-input" value={form.budgetValue} onChange={(e) => set("budgetValue", e.target.value)} />
          </div>
          <div>
            <label className="np-label np-label-pair" htmlFor="installments">Parcelas</label>
            <input id="installments" type="number" min="0" step="1" className="np-input" value={form.installments} onChange={(e) => set("installments", e.target.value)} />
          </div>
          <div>
            <label className="np-label np-label-pair" htmlFor="paymentMethod">Forma de pagamento</label>
            <input id="paymentMethod" className="np-input" value={form.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value)} placeholder="Cartão, PIX..." />
          </div>
          <div>
            <label className="np-label np-label-pair" htmlFor="amountReceived">Valor recebido (R$)</label>
            <input id="amountReceived" type="number" min="0" step="0.01" className="np-input" value={form.amountReceived} onChange={(e) => set("amountReceived", e.target.value)} />
          </div>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label className="np-label" htmlFor="notes">Notas</label>
          <textarea id="notes" className="np-input" rows={4} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Observações, combinados..." />
        </div>

        <div style={{
          position: "fixed", bottom: 0, right: 0, width: "min(460px, 100vw)",
          padding: "16px 26px", background: "var(--np-paper)", borderTop: "1px solid var(--np-line)",
          display: "flex", gap: 10, justifyContent: "space-between",
        }}>
          {!isNew ? (
            <button type="button" className="np-btn np-btn-danger" onClick={handleDelete} disabled={busy !== "idle"}>
              <Trash2 size={14} /> {busy === "deleting" ? "Excluindo…" : "Excluir"}
            </button>
          ) : <span />}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            {error && <span style={{ fontSize: 12, color: "#b3261e" }}>{error}</span>}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" className="np-btn np-btn-ghost np-hairline" style={{ border: "1px solid var(--np-line)" }} onClick={onCancel} disabled={busy !== "idle"}>Cancelar</button>
              <button type="submit" className="np-btn np-btn-filled" disabled={busy !== "idle"}>
                <Check size={14} /> {busy === "saving" ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
