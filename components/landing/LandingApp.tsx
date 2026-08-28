"use client";

import { useState } from "react";
import "./landing.css";
import NavBar from "./NavBar";
import HomePage from "./HomePage";
import PortfolioPage from "./PortfolioPage";
import SobrePage from "./SobrePage";
import OrcamentoPage from "./OrcamentoPage";
import FloatingWhatsApp from "./FloatingWhatsApp";
import type { DbPortfolioItem } from "./portfolio-data";

export type PageId = "home" | "portfolio" | "sobre" | "orcamento";

// Todas as "páginas" ficam montadas o tempo todo (igual ao protótipo
// original, que trocava só a classe CSS) em vez de desmontar ao trocar de
// aba — assim o chat da Nina e o filtro do portfólio não perdem o estado
// quando o visitante troca de aba e volta.
export default function LandingApp({ dbPortfolio }: { dbPortfolio: DbPortfolioItem[] }) {
  const [active, setActive] = useState<PageId>("home");

  return (
    <>
      <NavBar active={active} onNavigate={setActive} />

      <div className={active === "home" ? "" : "hidden"}>
        <HomePage onNavigate={setActive} dbPortfolio={dbPortfolio} />
      </div>
      <div className={active === "portfolio" ? "" : "hidden"}>
        <PortfolioPage onNavigate={setActive} dbPortfolio={dbPortfolio} />
      </div>
      <div className={active === "sobre" ? "" : "hidden"}>
        <SobrePage />
      </div>
      <div className={active === "orcamento" ? "" : "hidden"}>
        <OrcamentoPage />
      </div>

      {active !== "orcamento" && <FloatingWhatsApp />}
    </>
  );
}
