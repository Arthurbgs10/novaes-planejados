"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, MapPin } from "lucide-react";
import type { LeadRecord, VisitRecord } from "@/lib/types";
import { VISIT_STATUS_LABELS, VISIT_TYPE_LABELS } from "@/lib/validation";
import { todayISO } from "./shared";
import VisitForm from "./VisitForm";

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DIAS_SEMANA = ["D","S","T","Q","Q","S","S"];

type FormTarget = null | { mode: "new"; prefillDate?: string } | { mode: "edit"; visit: VisitRecord };

export default function AgendaView({ leads, visits, onVisitsChange }: {
  leads: LeadRecord[];
  visits: VisitRecord[];
  onVisitsChange: (updater: (prev: VisitRecord[]) => VisitRecord[]) => void;
}) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selected, setSelected] = useState<string | null>(null);
  const [formTarget, setFormTarget] = useState<FormTarget>(null);

  const leadById = useMemo(() => new Map(leads.map((l) => [l.id, l])), [leads]);

  const byDate = useMemo(() => {
    const map: Record<string, VisitRecord[]> = {};
    visits.forEach((v) => {
      const iso = v.scheduled_at.slice(0, 10);
      (map[iso] = map[iso] || []).push(v);
    });
    return map;
  }, [visits]);

  const grid = useMemo(() => {
    const year = cursor.getFullYear(), month = cursor.getMonth();
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const cells: { n: number; outside: boolean; iso: string | null }[] = [];
    for (let i = firstDow - 1; i >= 0; i--) cells.push({ n: daysInPrevMonth - i, outside: true, iso: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ n: d, outside: false, iso });
    }
    while (cells.length % 7 !== 0 || cells.length < 42) {
      const n = cells.length - (firstDow + daysInMonth) + 1;
      cells.push({ n, outside: true, iso: null });
      if (cells.length >= 42) break;
    }
    return cells;
  }, [cursor]);

  const today = todayISO();
  const selectedVisits = (selected ? byDate[selected] || [] : []).slice().sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));

  function handleSaved(visit: VisitRecord) {
    onVisitsChange((prev) => {
      const exists = prev.some((v) => v.id === visit.id);
      return exists ? prev.map((v) => (v.id === visit.id ? visit : v)) : [...prev, visit];
    });
    setFormTarget(null);
  }

  function handleDeleted(id: string) {
    onVisitsChange((prev) => prev.filter((v) => v.id !== id));
    setFormTarget(null);
  }

  return (
    <div className="np-agenda-grid">
      <div className="np-card" style={{ padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <p className="np-serif" style={{ fontSize: 20 }}>
            {MESES[cursor.getMonth()]} <span style={{ color: "var(--np-fog)" }}>{cursor.getFullYear()}</span>
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="np-btn np-btn-ghost np-hairline" style={{ border: "1px solid var(--np-line)", padding: 8 }}
              onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))} aria-label="Mês anterior">
              <ChevronLeft size={15} />
            </button>
            <button className="np-btn np-btn-ghost np-hairline" style={{ border: "1px solid var(--np-line)", padding: "8px 14px" }}
              onClick={() => setCursor(() => { const d = new Date(); d.setDate(1); return d; })}>
              Hoje
            </button>
            <button className="np-btn np-btn-ghost np-hairline" style={{ border: "1px solid var(--np-line)", padding: 8 }}
              onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))} aria-label="Próximo mês">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 6 }}>
          {DIAS_SEMANA.map((d, i) => (
            <div key={i} style={{ textAlign: "center", fontSize: 11, color: "var(--np-silver)", padding: "4px 0" }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {grid.map((cell, i) => {
            const hasVisit = !!(cell.iso && byDate[cell.iso]?.length > 0);
            return (
              <div
                key={i}
                className={`np-cal-cell ${cell.outside ? "outside" : ""} ${cell.iso === today ? "today" : ""} ${cell.iso && cell.iso === selected ? "selected" : ""}`}
                onClick={() => cell.iso && setSelected(cell.iso === selected ? null : cell.iso)}
              >
                <span className="np-cal-num">{cell.n}</span>
                {hasVisit && <div className="np-cal-mark" />}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <p className="np-eyebrow">{selected || "Selecione uma data"}</p>
          <button className="np-btn np-btn-ghost" style={{ padding: "4px 4px", fontSize: 12.5 }} onClick={() => setFormTarget({ mode: "new", prefillDate: selected || today })}>
            <Plus size={13} /> Agendar
          </button>
        </div>

        {!selected ? (
          <p style={{ fontSize: 13.5, color: "var(--np-fog)", lineHeight: 1.6 }}>
            Toque em qualquer dia com um marcador para ver as visitas daquela data.
          </p>
        ) : selectedVisits.length === 0 ? (
          <p style={{ fontSize: 13.5, color: "var(--np-fog)", lineHeight: 1.6 }}>Nenhuma visita nesta data.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {selectedVisits.map((v) => {
              const lead = leadById.get(v.lead_id);
              return (
                <button key={v.id} onClick={() => setFormTarget({ mode: "edit", visit: v })} className="np-card" style={{ padding: 14, textAlign: "left", cursor: "pointer" }}>
                  <p className="np-serif" style={{ fontSize: 16 }}>{lead?.name || "Lead removido"}</p>
                  <p style={{ fontSize: 12, color: "var(--np-fog)", marginTop: 4, display: "flex", alignItems: "center", gap: 5 }}>
                    <MapPin size={11} /> {lead?.address || "Endereço não definido"}
                  </p>
                  <div style={{ marginTop: 8, display: "flex", gap: 8, fontSize: 12, color: "var(--np-green-dark)" }}>
                    <span>{VISIT_TYPE_LABELS[v.type]}</span>
                    <span>·</span>
                    <span>{new Date(v.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                    <span>·</span>
                    <span>{VISIT_STATUS_LABELS[v.status]}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {formTarget !== null && (
        <VisitForm
          initial={formTarget.mode === "edit" ? formTarget.visit : null}
          leads={leads}
          prefillDate={formTarget.mode === "new" ? formTarget.prefillDate : undefined}
          onCancel={() => setFormTarget(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
