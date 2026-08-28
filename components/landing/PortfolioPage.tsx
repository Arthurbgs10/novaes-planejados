"use client";

import { useState } from "react";
import { INSTAGRAM_URL, LOCATION } from "@/lib/site-config";
import type { PageId } from "./LandingApp";
import type { DbPortfolioItem } from "./portfolio-data";

type Category = "todos" | "cozinha" | "projeto3d";

const FILTERS: { id: Category; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "cozinha", label: "Cozinhas" },
  { id: "projeto3d", label: "Projetos 3D" },
];

const PORTFOLIO_ITEMS: { src: string; alt: string; label: string; category: Exclude<Category, "todos"> }[] = [
  { src: "/images/image_6ed192.jpg", alt: "Cozinha Grafite", label: "Cozinha moderna — Grafite com painel ripado", category: "cozinha" },
  { src: "/images/image_6ed196.jpg", alt: "Cozinha com Bancada", label: "Integração de ambientes — Bancada em Granito Preto", category: "cozinha" },
  { src: "/images/image_6ed1b6.jpg", alt: "Cozinha LED", label: "Detalhe iluminação LED — Sofisticação e praticidade", category: "cozinha" },
  { src: "/images/image_6ed1ae.jpg", alt: "Detalhe gavetas", label: "Precisão no acabamento — Puxadores tipo Gola", category: "cozinha" },
  { src: "/images/image_6ed115.jpg", alt: "Render Cozinha", label: "Apresentação de Projeto 3D", category: "projeto3d" },
  { src: "/images/image_6ed119.jpg", alt: "Cozinha Executada", label: "Execução perfeita do 3D para a realidade", category: "cozinha" },
];

export default function PortfolioPage({ onNavigate, dbPortfolio }: { onNavigate: (page: PageId) => void; dbPortfolio: DbPortfolioItem[] }) {
  const [filter, setFilter] = useState<Category>("todos");
  // Enquanto não houver fotos reais publicadas no painel, a página mostra
  // as imagens de exemplo do protótipo original.
  const items: { src: string; alt: string; label: string; category: string | null }[] =
    dbPortfolio.length > 0 ? dbPortfolio : PORTFOLIO_ITEMS;
  const visible = items.filter((item) => filter === "todos" || item.category === filter);

  return (
    <div className="page">
      <section className="section">
        <div className="section-tag">Portfólio completo</div>
        <h2 className="section-title">
          <em>Inspire-se</em> com nossos projetos
        </h2>
        <p className="section-sub">Cada projeto é único. Clique para se inspirar e use isso na hora de solicitar seu orçamento.</p>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "2rem" }}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`opt-btn${filter === f.id ? " selected" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {visible.map((item) => (
            <div className="portfolio-item" key={item.src} style={{ height: 220, borderRadius: "var(--radius)" }}>
              <img src={item.src} alt={item.alt} />
              <div className="portfolio-overlay"><span className="portfolio-label">{item.label}</span></div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <button type="button" className="btn-primary" onClick={() => onNavigate("orcamento")}>
            Gostei! Quero um projeto assim
          </button>
        </div>
      </section>
      <footer>
        <strong>Novaes Planejados</strong> · {LOCATION}
        <br />
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">@novaesplanejadoss</a>
      </footer>
    </div>
  );
}
