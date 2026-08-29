"use client";

import { useMemo, useState } from "react";
import {
  Users, CalendarDays, LayoutGrid, Images, Search, Plus,
  ArrowUpRight, Menu, LogOut, X, MapPin,
} from "lucide-react";
import type { LeadRecord, VisitRecord, PortfolioItemRecord } from "@/lib/types";
import { LEAD_STATUS_LABELS, LEAD_STATUS_VALUES, type LeadStatus } from "@/lib/validation";
import { signOutAction } from "@/app/painel/actions";
import { StatCard, EmptyState, LeadStatusBadge, formatCurrency, formatDateTimePt, todayISO } from "./shared";
import LeadForm from "./LeadForm";
import AgendaView from "./AgendaView";
import PortfolioView from "./PortfolioView";

/* ------------------------------ listas ------------------------------ */

function LeadRow({ lead, onEdit }: { lead: LeadRecord; onEdit: (l: LeadRecord) => void }) {
  return (
    <button
      onClick={() => onEdit(lead)}
      className="np-hairline"
      style={{
        display: "flex", alignItems: "center", gap: 16, width: "100%",
        padding: "14px 6px", background: "none",
        border: 0, borderTop: "1px solid var(--np-line)",
        textAlign: "left", cursor: "pointer",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="np-serif" style={{ fontSize: 16, marginBottom: 3 }}>{lead.name}</p>
        <p style={{ fontSize: 12.5, color: "var(--np-fog)", display: "flex", alignItems: "center", gap: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          <MapPin size={12} style={{ flexShrink: 0 }} /> {lead.address || "Endereço não definido"}
        </p>
      </div>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
        {lead.budget_value != null && (
          <span style={{ fontSize: 12.5, color: "var(--np-fog)" }}>{formatCurrency(lead.budget_value)}</span>
        )}
        <LeadStatusBadge status={lead.status} />
      </div>
    </button>
  );
}

function OverviewView({ leads, visits, onEdit, onNew, onGoAgenda }: {
  leads: LeadRecord[]; visits: VisitRecord[];
  onEdit: (l: LeadRecord) => void; onNew: () => void; onGoAgenda: () => void;
}) {
  const today = todayISO();
  const nowIso = new Date().toISOString();

  const thisMonthCount = useMemo(() => {
    const ym = today.slice(0, 7);
    return leads.filter((l) => l.created_at.startsWith(ym)).length;
  }, [leads, today]);

  const nextVisit = useMemo(
    () => visits.filter((v) => v.scheduled_at >= nowIso && v.status === "agendada").sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))[0],
    [visits, nowIso]
  );
  const nextVisitLead = nextVisit ? leads.find((l) => l.id === nextVisit.lead_id) : null;

  // "Em carteira" = orçamentos ainda em andamento (nem perdidos, nem já
  // instalados) — o que falta fechar/entregar. "Faturado" = o que já foi
  // instalado, pra esse valor não simplesmente sumir da visão geral quando
  // um lead muda de status (antes só existia o primeiro, e o valor de um
  // projeto concluído parecia "zerar").
  const emCarteira = useMemo(
    () => leads.filter((l) => l.status !== "perdido" && l.status !== "instalado").reduce((sum, l) => sum + (l.budget_value || 0), 0),
    [leads]
  );
  const faturado = useMemo(
    () => leads.filter((l) => l.status === "instalado").reduce((sum, l) => sum + (l.budget_value || 0), 0),
    [leads]
  );

  const recent = leads.slice().sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 14, marginBottom: 34 }}>
        <StatCard label="Leads" value={leads.length} sub={leads.length === 1 ? "no funil" : "no funil"} />
        <StatCard label="Este mês" value={thisMonthCount} sub={thisMonthCount === 1 ? "novo lead" : "novos leads"} />
        <StatCard
          label="Próxima visita"
          value={nextVisit ? formatDateTimePt(nextVisit.scheduled_at) : "—"}
          sub={nextVisit ? nextVisitLead?.name || "Lead removido" : "Nada agendado"}
        />
        <StatCard label="Em carteira" value={formatCurrency(emCarteira)} sub="orçamentos em andamento" />
        <StatCard label="Faturado" value={formatCurrency(faturado)} sub="projetos instalados" />
      </div>

      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
        <p className="np-serif" style={{ fontSize: 19 }}>Leads recentes</p>
        <button className="np-btn np-btn-ghost" style={{ padding: "4px 4px", fontSize: 12.5 }} onClick={onGoAgenda}>
          Ver agenda <ArrowUpRight size={13} />
        </button>
      </div>

      {recent.length === 0 ? (
        <EmptyState
          title="Nada por aqui ainda"
          sub="Assim que um lead chegar pelo chat da Nina ou for cadastrado manualmente, ele aparece aqui."
          actionLabel="Novo lead"
          onAction={onNew}
        />
      ) : (
        <div className="np-card" style={{ padding: "4px 16px" }}>
          {recent.map((l) => <LeadRow key={l.id} lead={l} onEdit={onEdit} />)}
        </div>
      )}
    </div>
  );
}

function LeadsView({ leads, onEdit, onNew }: {
  leads: LeadRecord[]; onEdit: (l: LeadRecord) => void; onNew: () => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "todos">("todos");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads
      .filter((l) => (statusFilter === "todos" ? true : l.status === statusFilter))
      .filter((l) => (q ? `${l.name} ${l.phone ?? ""}`.toLowerCase().includes(q) : true))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [leads, search, statusFilter]);

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 22, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 200 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--np-silver)" }} />
          <input
            className="np-input" style={{ paddingLeft: 34 }}
            placeholder="Buscar por nome ou telefone"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="np-input" style={{ maxWidth: 220, cursor: "pointer" }}
          value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "todos")}
        >
          <option value="todos">Todos os status</option>
          {LEAD_STATUS_VALUES.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
        </select>
        <button className="np-btn np-btn-filled" onClick={onNew}><Plus size={15} /> Novo lead</button>
      </div>

      {leads.length === 0 ? (
        <EmptyState
          title="Nenhum lead ainda"
          sub="Cadastre o primeiro lead para começar a organizar contatos, orçamentos e status num só lugar."
          actionLabel="Novo lead"
          onAction={onNew}
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="Nada encontrado" sub="Tente outro termo ou limpe o filtro de status." />
      ) : (
        <div className="np-card" style={{ padding: "4px 16px" }}>
          {filtered.map((l) => <LeadRow key={l.id} lead={l} onEdit={onEdit} />)}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ app principal ------------------------------ */

type FormTarget = null | { mode: "new" } | { mode: "edit"; lead: LeadRecord };
type ViewId = "overview" | "leads" | "agenda" | "portfolio";

export default function DashboardApp({ initialLeads, initialVisits, initialPortfolioItems, userEmail }: {
  initialLeads: LeadRecord[];
  initialVisits: VisitRecord[];
  initialPortfolioItems: PortfolioItemRecord[];
  userEmail: string;
}) {
  const [leads, setLeads] = useState<LeadRecord[]>(initialLeads);
  const [visits, setVisits] = useState<VisitRecord[]>(initialVisits);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItemRecord[]>(initialPortfolioItems);
  const [view, setView] = useState<ViewId>("overview");
  const [formTarget, setFormTarget] = useState<FormTarget>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  function handleSaved(lead: LeadRecord) {
    setLeads((prev) => {
      const exists = prev.some((c) => c.id === lead.id);
      return exists ? prev.map((c) => (c.id === lead.id ? lead : c)) : [...prev, lead];
    });
    setFormTarget(null);
  }

  function handleDeleted(id: string) {
    setLeads((prev) => prev.filter((c) => c.id !== id));
    setFormTarget(null);
  }

  const NAV_ITEMS: { id: ViewId; label: string; icon: typeof LayoutGrid }[] = [
    { id: "overview", label: "Visão geral", icon: LayoutGrid },
    { id: "leads", label: "Leads", icon: Users },
    { id: "agenda", label: "Agenda", icon: CalendarDays },
    { id: "portfolio", label: "Portfólio", icon: Images },
  ];

  return (
    <div className="np-root">
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <aside className={`np-sidebar ${mobileNavOpen ? "open" : ""}`}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p className="np-serif" style={{ fontSize: 20 }}>Novaes Planejados</p>
              <p style={{ fontSize: 11, color: "var(--np-fog)", marginTop: 2 }}>Painel</p>
            </div>
            <button
              className="np-btn np-btn-ghost np-sidebar-close"
              style={{ border: "none", padding: 6, display: "none" }}
              onClick={() => setMobileNavOpen(false)}
              aria-label="Fechar menu"
            >
              <X size={20} />
            </button>
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`np-nav-item ${view === id ? "active" : ""}`}
                onClick={() => { setView(id); setMobileNavOpen(false); }}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </nav>
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 11.5, color: "var(--np-silver)", lineHeight: 1.5, wordBreak: "break-all" }}>
              {userEmail}
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                className="np-btn np-btn-ghost np-hairline"
                style={{ border: "1px solid var(--np-line)", fontSize: 12, justifyContent: "center", width: "100%" }}
              >
                <LogOut size={14} /> Sair
              </button>
            </form>
          </div>
        </aside>

        <main style={{ flex: 1, minWidth: 0, padding: "26px 28px 60px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 26 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                className="np-btn np-btn-ghost np-hairline np-menu-btn"
                style={{ border: "1px solid var(--np-line)", padding: 8 }}
                onClick={() => setMobileNavOpen((v) => !v)}
                aria-label="Abrir menu"
              >
                <Menu size={16} />
              </button>
              <p className="np-serif" style={{ fontSize: 26 }}>
                {NAV_ITEMS.find((n) => n.id === view)?.label}
              </p>
            </div>
          </div>

          {view === "overview" ? (
            <OverviewView
              leads={leads} visits={visits}
              onEdit={(l) => setFormTarget({ mode: "edit", lead: l })}
              onNew={() => setFormTarget({ mode: "new" })}
              onGoAgenda={() => setView("agenda")}
            />
          ) : view === "leads" ? (
            <LeadsView
              leads={leads}
              onEdit={(l) => setFormTarget({ mode: "edit", lead: l })}
              onNew={() => setFormTarget({ mode: "new" })}
            />
          ) : view === "agenda" ? (
            <AgendaView leads={leads} visits={visits} onVisitsChange={setVisits} />
          ) : (
            <PortfolioView items={portfolioItems} onItemsChange={setPortfolioItems} />
          )}
        </main>
      </div>

      {formTarget !== null && (
        <LeadForm
          initial={formTarget.mode === "edit" ? formTarget.lead : null}
          onCancel={() => setFormTarget(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
