"use client";

import type { PageId } from "./LandingApp";

const TABS: { id: PageId; label: string }[] = [
  { id: "home", label: "Início" },
  { id: "portfolio", label: "Portfólio" },
  { id: "sobre", label: "Sobre nós" },
  { id: "orcamento", label: "Orçamento" },
];

export default function NavBar({ active, onNavigate }: { active: PageId; onNavigate: (page: PageId) => void }) {
  return (
    <nav>
      <div className="nav-logo">Novaes Planejados</div>
      <ul className="nav-tabs">
        {TABS.map((tab) => (
          <li key={tab.id}>
            <button type="button" className={active === tab.id ? "active" : ""} onClick={() => onNavigate(tab.id)}>
              {tab.label}
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="nav-cta" onClick={() => onNavigate("orcamento")}>
        Solicitar orçamento
      </button>
    </nav>
  );
}
