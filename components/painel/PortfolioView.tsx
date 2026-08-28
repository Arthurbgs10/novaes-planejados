"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import type { PortfolioItemRecord } from "@/lib/types";
import { portfolioImageUrl } from "@/lib/supabase/storage";
import { deletePortfolioItemAction, setPortfolioItemPublishedAction } from "@/app/painel/actions";
import { EmptyState } from "./shared";
import PortfolioItemForm from "./PortfolioItemForm";

type FormTarget = null | { mode: "new" } | { mode: "edit"; item: PortfolioItemRecord };

export default function PortfolioView({ items, onItemsChange }: {
  items: PortfolioItemRecord[];
  onItemsChange: (updater: (prev: PortfolioItemRecord[]) => PortfolioItemRecord[]) => void;
}) {
  const [formTarget, setFormTarget] = useState<FormTarget>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const sorted = items.slice().sort((a, b) => a.display_order - b.display_order);

  function handleSaved(item: PortfolioItemRecord) {
    onItemsChange((prev) => {
      const exists = prev.some((p) => p.id === item.id);
      return exists ? prev.map((p) => (p.id === item.id ? item : p)) : [...prev, item];
    });
    setFormTarget(null);
  }

  async function handleTogglePublished(item: PortfolioItemRecord) {
    setBusyId(item.id);
    const result = await setPortfolioItemPublishedAction(item.id, !item.published);
    setBusyId(null);
    if (result.ok) {
      onItemsChange((prev) => prev.map((p) => (p.id === item.id ? result.data : p)));
    }
  }

  async function handleDelete(item: PortfolioItemRecord) {
    setBusyId(item.id);
    const result = await deletePortfolioItemAction(item.id);
    setBusyId(null);
    if (result.ok) {
      onItemsChange((prev) => prev.filter((p) => p.id !== item.id));
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 22 }}>
        <button className="np-btn np-btn-filled" onClick={() => setFormTarget({ mode: "new" })}>
          <Plus size={15} /> Novo projeto
        </button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title="Nenhum projeto ainda"
          sub="Suba as fotos reais dos projetos entregues — elas substituem as imagens de exemplo na galeria pública do site."
          actionLabel="Novo projeto"
          onAction={() => setFormTarget({ mode: "new" })}
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 18 }}>
          {sorted.map((item) => (
            <div key={item.id} className="np-card" style={{ overflow: "hidden" }}>
              <div className="np-portfolio-thumb">
                {item.image_path && <img src={portfolioImageUrl(item.image_path)} alt={item.title} />}
              </div>
              <div style={{ padding: 14 }}>
                <p className="np-serif" style={{ fontSize: 15.5, marginBottom: 4 }}>{item.title}</p>
                {item.category && <p style={{ fontSize: 12, color: "var(--np-fog)", marginBottom: 10 }}>{item.category}</p>}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <button
                    className="np-btn np-btn-ghost np-hairline" style={{ border: "1px solid var(--np-line)", fontSize: 11.5, padding: "6px 10px" }}
                    onClick={() => handleTogglePublished(item)} disabled={busyId === item.id}
                  >
                    {item.published ? <Eye size={13} /> : <EyeOff size={13} />} {item.published ? "Publicado" : "Rascunho"}
                  </button>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="np-btn np-btn-ghost" style={{ border: "none", padding: 6 }} onClick={() => setFormTarget({ mode: "edit", item })} aria-label="Editar">
                      <Pencil size={14} />
                    </button>
                    <button className="np-btn np-btn-ghost" style={{ border: "none", padding: 6, color: "#b3261e" }} onClick={() => handleDelete(item)} disabled={busyId === item.id} aria-label="Excluir">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {formTarget !== null && (
        <PortfolioItemForm
          initial={formTarget.mode === "edit" ? formTarget.item : null}
          onCancel={() => setFormTarget(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
