import { INSTAGRAM_URL, WHATSAPP_NUMBER, FOUNDERS, LOCATION } from "@/lib/site-config";
import type { PageId } from "./LandingApp";
import type { DbPortfolioItem } from "./portfolio-data";

const HOME_PORTFOLIO = [
  { src: "/images/image_6ed196.jpg", alt: "Cozinha com bancada", label: "Cozinha Grafite & Preto — Campo Grande" },
  { src: "/images/image_6ed1b6.jpg", alt: "Cozinha detalhe pia", label: "Iluminação em LED" },
  { src: "/images/image_6ed1ae.jpg", alt: "Armário detalhe", label: "Acabamentos e Puxadores" },
  { src: "/images/image_6ed115.jpg", alt: "Projeto 3D Cozinha", label: "Projeto 3D (Render)" },
  { src: "/images/image_6ed119.jpg", alt: "Cozinha Executada", label: "Projeto Finalizado" },
];

export default function HomePage({ onNavigate, dbPortfolio }: { onNavigate: (page: PageId) => void; dbPortfolio: DbPortfolioItem[] }) {
  // Enquanto não houver fotos reais publicadas no painel, a home continua
  // mostrando as imagens de exemplo do protótipo original.
  const portfolio = dbPortfolio.length > 0 ? dbPortfolio.slice(0, 5) : HOME_PORTFOLIO;
  return (
    <div className="page">
      <section className="hero">
        <div className="hero-left">
          <div className="hero-tag">{LOCATION}</div>
          <h1>
            Transformamos <em>sonhos</em> em ambientes únicos
          </h1>
          <p>
            Móveis planejados feitos sob medida para a sua vida. Do projeto à entrega, cada detalhe é pensado com
            cuidado e personalidade.
          </p>
          <div className="hero-btns">
            <button type="button" className="btn-primary" onClick={() => onNavigate("orcamento")}>
              Solicitar orçamento grátis
            </button>
            <button type="button" className="btn-secondary" onClick={() => onNavigate("portfolio")}>
              Ver projetos
            </button>
          </div>
        </div>
        <div className="hero-right">
          <div className="hero-img">
            <img src="/images/image_6ed192.jpg" alt="Cozinha planejada moderna grafite" />
          </div>
          <div className="hero-img">
            <img src="/images/image_6ed1ae.jpg" alt="Detalhe de móvel e gavetas" />
          </div>
          <div className="hero-img">
            <img src="/images/image_6ed1b6.jpg" alt="Detalhe de pia com fita LED" />
          </div>
          <div className="hero-badge">
            <div className="hero-badge-dot" />
            <span>+50 projetos entregues em Campo Grande</span>
          </div>
        </div>
      </section>

      <div className="stats-bar">
        <div className="stat"><span className="stat-num">+50</span><span className="stat-label">Projetos entregues</span></div>
        <div className="stat"><span className="stat-num">30</span><span className="stat-label">Dias para entrega</span></div>
        <div className="stat"><span className="stat-num">100%</span><span className="stat-label">Personalizado</span></div>
        <div className="stat"><span className="stat-num">12x</span><span className="stat-label">No cartão</span></div>
      </div>

      <section className="section">
        <div className="section-tag">Nossos projetos</div>
        <h2 className="section-title">
          Cada ambiente tem <em>uma história</em>
        </h2>
        <p className="section-sub">Cozinhas, quartos, salas e muito mais — planejados para o seu jeito de viver.</p>
        <div className="portfolio-grid">
          {portfolio.map((item) => (
            <div className="portfolio-item" key={item.src}>
              <img src={item.src} alt={item.alt} />
              <div className="portfolio-overlay"><span className="portfolio-label">{item.label}</span></div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <button type="button" className="btn-secondary" onClick={() => onNavigate("portfolio")}>
            Ver todos os projetos
          </button>
        </div>
      </section>

      <footer>
        <strong>Novaes Planejados</strong> · {LOCATION} · Fundadores: {FOUNDERS}
        <br />
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">@novaesplanejadoss</a>
        {" · "}
        <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">(21) 97502-5723</a>
      </footer>
    </div>
  );
}
