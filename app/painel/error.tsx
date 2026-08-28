"use client";

export default function PainelError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="np-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24 }}>
      <div className="np-card" style={{ padding: 28, maxWidth: 380, textAlign: "center" }}>
        <p className="np-serif" style={{ fontSize: 20, marginBottom: 10 }}>Algo travou aqui</p>
        <p style={{ fontSize: 13, color: "var(--np-fog)", marginBottom: 18 }}>
          Isso não deveria acontecer. Tente de novo — se persistir, recarregue a página.
        </p>
        <button className="np-btn np-btn-filled" style={{ margin: "0 auto" }} onClick={reset}>
          Tentar de novo
        </button>
      </div>
    </div>
  );
}
