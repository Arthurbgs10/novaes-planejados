import { INSTAGRAM_URL, LOCATION } from "@/lib/site-config";

const VALORES = [
  { icon: "✦", title: "Qualidade", text: "Materiais selecionados e acabamento impecável em cada projeto." },
  { icon: "◈", title: "Personalização", text: "Nenhum projeto é cópia de outro. Cada um é único como quem encomenda." },
  { icon: "◉", title: "Transparência", text: "Orçamento claro, sem surpresas. Você sabe exatamente o que está contratando." },
  { icon: "❋", title: "Cuidado humano", text: "Atendimento próximo, respeitoso e feito por pessoas que se importam." },
];

export default function SobrePage() {
  return (
    <div className="page">
      <div className="sobre-hero">
        <div
          className="section-tag"
          style={{ background: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.8)" }}
        >
          Nossa história
        </div>
        <h2>
          Feitos com <em>propósito</em>,<br />
          entregues com alma
        </h2>
        <p>
          A Novaes Planejados nasceu do desejo de transformar espaços comuns em ambientes que refletem a
          personalidade de quem os habita.
        </p>
      </div>

      <div className="sobre-content">
        <div
          className="sobre-img-wrap"
          style={{ background: "var(--white)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}
        >
          <img src="/images/image_6ed0fa.png" alt="Logo Novaes" style={{ objectFit: "contain", width: "80%" }} />
          <div className="sobre-img-badge">
            <span className="num">+50</span>
            <span className="lbl">sonhos realizados</span>
          </div>
        </div>
        <div className="sobre-text">
          <h3>Personalidade em cada detalhe</h3>
          <p>
            Marcela e Carlos Daniel fundaram a Novaes com uma missão clara: nenhum ambiente deve ser genérico. Cada
            família tem uma rotina, um jeito de viver, um sonho de espaço. E é exatamente isso que buscamos entender
            antes de começar qualquer projeto.
          </p>
          <p>
            Baseados em {LOCATION}, atendemos famílias que querem mais do que móveis — querem um lar que funcione de
            verdade, que seja bonito, durável e completamente deles.
          </p>
          <p>Do primeiro contato ao último acabamento, estamos presentes. Essa é a nossa promessa.</p>
          <div className="valores-grid">
            {VALORES.map((v) => (
              <div className="valor-card" key={v.title}>
                <div className="icon">{v.icon}</div>
                <h4>{v.title}</h4>
                <p>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="founders">
        <h3>Quem faz acontecer</h3>
        <div className="founders-grid">
          <div className="founder-card">
            <div className="founder-avatar">M</div>
            <h4>Marcela</h4>
            <span>Co-fundadora · Design &amp; Atendimento</span>
          </div>
          <div className="founder-card">
            <div className="founder-avatar">C</div>
            <h4>Carlos Daniel</h4>
            <span>Co-fundador · Projetos &amp; Execução</span>
          </div>
        </div>
      </div>
      <footer>
        <strong>Novaes Planejados</strong> · {LOCATION} · Fundadores: Marcela e Carlos Daniel
        <br />
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">@novaesplanejadoss</a>
      </footer>
    </div>
  );
}
