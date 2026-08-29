"use client";

import { useEffect, useRef, useState } from "react";
import { X, Check } from "lucide-react";
import type { PortfolioItemRecord } from "@/lib/types";
import { portfolioImageUrl } from "@/lib/supabase/storage";
import { PORTFOLIO_CATEGORY_OPTIONS } from "@/lib/validation";
import { createPortfolioItemAction, updatePortfolioItemAction } from "@/app/painel/actions";

export default function PortfolioItemForm({ initial, onCancel, onSaved }: {
  initial: PortfolioItemRecord | null;
  onCancel: () => void;
  onSaved: (item: PortfolioItemRecord) => void;
}) {
  const isNew = !initial?.id;
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [category, setCategory] = useState(initial?.category || "");
  const [displayOrder, setDisplayOrder] = useState(String(initial?.display_order ?? 0));
  const [published, setPublished] = useState(initial?.published ?? false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onCancel(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Dê um título ao projeto."); return; }
    setBusy(true);
    const fd = new FormData(formRef.current!);
    const result = isNew ? await createPortfolioItemAction(fd) : await updatePortfolioItemAction(initial!.id, fd);
    setBusy(false);
    if (!result.ok) { setError(result.error); return; }
    onSaved(result.data);
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }} role="dialog" aria-modal="true">
      <div onClick={onCancel} style={{ position: "absolute", inset: 0, background: "rgba(42,42,42,.35)" }} />
      <form ref={formRef} onSubmit={handleSubmit} className="np-card" style={{ position: "relative", width: "min(440px, 92vw)", padding: 26, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <p className="np-serif" style={{ fontSize: 20 }}>{isNew ? "Novo projeto" : "Editar projeto"}</p>
          <button type="button" className="np-btn np-btn-ghost" style={{ border: "none", padding: 6 }} onClick={onCancel} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        {initial?.image_path && (
          <div className="np-portfolio-thumb" style={{ marginBottom: 14, aspectRatio: "16/9" }}>
            <img src={portfolioImageUrl(initial.image_path)} alt={initial.title} />
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label className="np-label" htmlFor="image">{initial?.image_path ? "Trocar foto (opcional)" : "Foto"}</label>
          <input id="image" name="image" type="file" accept="image/*" className="np-input" />
          {initial?.image_path && (
            <p style={{ fontSize: 11.5, color: "var(--np-fog)", marginTop: 6 }}>
              Enviar uma foto aqui substitui a foto deste card. Pra adicionar um projeto novo, feche e use &quot;Novo projeto&quot;.
            </p>
          )}
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="np-label" htmlFor="title">Título</label>
          <input id="title" name="title" className="np-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Cozinha Grafite — Campo Grande" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label className="np-label np-label-pair" htmlFor="category">Cômodo / categoria</label>
            <select id="category" name="category" className="np-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Geral (sem cômodo)</option>
              {PORTFOLIO_CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="np-label np-label-pair" htmlFor="displayOrder">Ordem</label>
            <input id="displayOrder" name="displayOrder" type="number" step="1" className="np-input" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="np-label" htmlFor="description">Descrição</label>
          <textarea id="description" name="description" className="np-input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13.5 }}>
          <input type="checkbox" name="published" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          Publicado no site
        </label>

        {error && <p style={{ fontSize: 12, color: "#b3261e", marginBottom: 14 }}>{error}</p>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button type="button" className="np-btn np-btn-ghost np-hairline" style={{ border: "1px solid var(--np-line)" }} onClick={onCancel} disabled={busy}>Cancelar</button>
          <button type="submit" className="np-btn np-btn-filled" disabled={busy}>
            <Check size={14} /> {busy ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
