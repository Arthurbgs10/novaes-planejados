"use client";

import { useEffect, useRef, useState } from "react";
import { flow, initialUserData, SIDEBAR_STEP_MAP, type UserData } from "./flow";
import { WHATSAPP_NUMBER } from "@/lib/site-config";
import { createChatLeadAction } from "@/app/actions/leads";

/* ------------------------------------------------------------------ *
 * Nina — assistente de orçamento em chat.
 * Motor portado do protótipo original (index.html): mesmo roteiro de
 * perguntas (flow.ts), mesmos tempos de "digitando...", mesma mensagem
 * final de WhatsApp. A diferença é que aqui o estado vive em React em vez
 * de manipulação direta do DOM, e as mensagens do usuário são renderizadas
 * como texto puro (não HTML) — o protótipo original usava innerHTML também
 * para o texto digitado pelo visitante, o que permitiria injetar HTML/JS
 * através do próprio chat público.
 * ------------------------------------------------------------------ */

interface ChatMsg {
  id: number;
  role: "ai" | "user";
  html: string;
}

const STEP_LABELS = [
  { label: "Identificação", desc: "Nome e contato" },
  { label: "Localização", desc: "Endereço e imóvel" },
  { label: "Ambiente", desc: "Qual cômodo?" },
  { label: "Estilo", desc: "Cores e inspirações" },
  { label: "Medidas", desc: "Especificações" },
  { label: "Resumo", desc: "Visita e envio" },
];

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function buildWhatsAppMessage(u: UserData) {
  let equipText = "";
  if (u.ambiente.includes("Cozinha")) {
    equipText += `*Geladeira:* ${u.geladeira || "—"}\n*Fogão/Cooktop:* ${u.fogao || "—"}\n`;
    if (u.microondas) equipText += `*Microondas:* ${u.microondas}\n`;
    if (u.coifa) equipText += `*Coifa/Depurador:* ${u.coifa}\n`;
  }
  if (u.ambiente.includes("Quarto") && u.cama) {
    equipText += `*Tamanho da Cama:* ${u.cama}\n`;
  }
  if (u.ambiente.includes("Lavanderia") && u.maquina) {
    equipText += `*Máquina de Lavar:* ${u.maquina}\n`;
  }

  return (
    `*Novo pedido de orçamento — Novaes Planejados* 🌿\n\n` +
    `*Nome:* ${u.nome}\n*Telefone:* ${u.tel}\n*Endereço:* ${u.end}\n*Imóvel:* ${u.tipo}\n*Visita:* ${u.visita}\n\n` +
    `*Ambientes:* ${u.ambiente}\n*Cor:* ${u.cor}\n*Estilo:* ${u.estilo}\n\n` +
    (equipText
      ? `*Especificações por cômodo:*\n${equipText}`
      : `_Ambientes selecionados sob consulta para visita técnica._\n`) +
    `\n_Pedido gerado pelo site Novaes Planejados_`
  );
}

export default function NinaChat() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [typing, setTyping] = useState(false);
  const [options, setOptions] = useState<string[] | null>(null);
  const [multiSelect, setMultiSelect] = useState(false);
  const [selectedMulti, setSelectedMulti] = useState<string[]>([]);
  const [inputEnabled, setInputEnabled] = useState(false);
  const [placeholder, setPlaceholder] = useState("Digite aqui...");
  const [maxChars, setMaxChars] = useState<number | undefined>(undefined);
  const [inputValue, setInputValue] = useState("");
  const [progressPct, setProgressPct] = useState(0);
  const [sidebarStepIdx, setSidebarStepIdx] = useState(0);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [finalUserData, setFinalUserData] = useState<UserData | null>(null);

  const stepRef = useRef(0);
  const userDataRef = useRef<UserData>({ ...initialUserData });
  const msgIdRef = useRef(0);
  const startedRef = useRef(false);
  const mountedAtRef = useRef(Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, typing]);

  function pushMessage(role: "ai" | "user", html: string) {
    msgIdRef.current += 1;
    setMessages((prev) => [...prev, { id: msgIdRef.current, role, html }]);
  }

  function updateSidebar(idx: number) {
    const pct = Math.min(Math.round(((idx + 1) / flow.length) * 100), 100);
    setProgressPct(pct);
    setSidebarStepIdx(SIDEBAR_STEP_MAP[idx] ?? 0);
  }

  async function runStep(idx: number) {
    stepRef.current = idx;
    const step = flow[idx];
    if (!step) return;

    if (step.condition && !step.condition(userDataRef.current)) {
      return runStep(idx + 1);
    }

    setOptions(null);
    setMultiSelect(false);
    setSelectedMulti([]);
    setInputEnabled(false);

    for (let i = 0; i < step.messages.length; i++) {
      const msg = step.messages[i];
      const isLast = i === step.messages.length - 1;

      if (!isLast) {
        setTyping(true);
        await wait(msg.delay);
        setTyping(false);
      } else {
        await wait(msg.delay);
      }

      const text = typeof msg.text === "function" ? msg.text(userDataRef.current) : msg.text;
      pushMessage("ai", text);

      if (isLast) {
        await wait(400);
        if (step.final) {
          updateSidebar(idx);
          await wait(1500);
          setFinalUserData({ ...userDataRef.current });
          setSummaryVisible(true);
          // Best-effort: grava o lead no Supabase em paralelo. Se falhar
          // (rede, RLS, etc.), o visitante não percebe — o resumo e o
          // WhatsApp continuam funcionando normalmente.
          createChatLeadAction({ ...userDataRef.current }, mountedAtRef.current).catch(() => {});
          return;
        }
        if (step.options && step.options.length > 0) {
          setMultiSelect(!!step.multiSelect);
          setOptions(step.options);
        }
        if (step.input) {
          setPlaceholder(step.inputPlaceholder ?? "Digite aqui...");
          setMaxChars(step.maxChars);
          setInputEnabled(true);
        }
      } else {
        await wait(600);
      }
    }
  }

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    runStep(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyPatchAndAdvance(patch: Partial<UserData>) {
    userDataRef.current = { ...userDataRef.current, ...patch };
    updateSidebar(stepRef.current);
  }

  function handleOptionClick(opt: string) {
    const step = flow[stepRef.current];
    pushMessage("user", opt);
    setOptions(null);
    applyPatchAndAdvance(step.onOption?.(opt) ?? {});
    const next = stepRef.current + 1;
    setTimeout(() => runStep(next), 1200);
  }

  function toggleMultiOption(opt: string) {
    setSelectedMulti((prev) => (prev.includes(opt) ? prev.filter((v) => v !== opt) : [...prev, opt]));
  }

  function handleMultiConfirm() {
    const step = flow[stepRef.current];
    const val = selectedMulti.join(", ") || step.options?.[step.options.length - 1] || "";
    pushMessage("user", val);
    setOptions(null);
    applyPatchAndAdvance(step.onOption?.(val) ?? {});
    const next = stepRef.current + 1;
    setTimeout(() => runStep(next), 1200);
  }

  function handleSend() {
    if (!inputEnabled) return;
    const val = inputValue.trim();
    if (!val) return;
    const step = flow[stepRef.current];
    setInputValue("");
    setInputEnabled(false);
    pushMessage("user", val);
    applyPatchAndAdvance(step.onInput?.(val) ?? {});
    const next = stepRef.current + 1;
    setTimeout(() => runStep(next), 600);
  }

  function handleWhatsApp() {
    if (!finalUserData) return;
    const msg = encodeURIComponent(buildWhatsAppMessage(finalUserData));
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
  }

  const hasEquip =
    !!finalUserData &&
    (finalUserData.ambiente.includes("Cozinha") ||
      (finalUserData.ambiente.includes("Lavanderia") && !!finalUserData.maquina));

  return (
    <div className="orcamento-page">
      <div className="orcamento-sidebar">
        <div className="sidebar-title">
          Solicitar
          <br />
          orçamento
        </div>
        <p className="sidebar-sub">Nossa assistente Nina vai te guiar em poucos minutos</p>

        <div className="progress-bar-wrap">
          <div className="progress-label">
            <span>Progresso</span>
            <span>{progressPct}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <ul className="steps-list">
          {STEP_LABELS.map((s, i) => (
            <li
              key={s.label}
              className={`step-item${i < sidebarStepIdx ? " done" : i === sidebarStepIdx ? " active" : ""}`}
            >
              <div className="step-num">{i + 1}</div>
              <div className="step-info">
                <div className="step-label">{s.label}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="chat-area">
        <div className="chat-header">
          <div className="ai-avatar">
            N
            <div className="ai-online" />
          </div>
          <div className="chat-header-info">
            <h4>Nina · Novaes Planejados</h4>
            <span>● Online agora</span>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((m) => (
            <div className={`msg ${m.role}`} key={m.id}>
              <div className="msg-avatar" style={m.role === "user" ? { background: "var(--green)", color: "white" } : undefined}>
                {m.role === "ai" ? "N" : "U"}
              </div>
              {m.role === "ai" ? (
                <div className="msg-bubble" dangerouslySetInnerHTML={{ __html: m.html }} />
              ) : (
                <div className="msg-bubble">{m.html}</div>
              )}
            </div>
          ))}
          {typing && (
            <div className="msg ai">
              <div className="msg-avatar">N</div>
              <div className="msg-bubble">
                <div className="typing">
                  <div className="dot" />
                  <div className="dot" />
                  <div className="dot" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          {options && (
            <div className="options-grid">
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`opt-btn${multiSelect && selectedMulti.includes(opt) ? " selected" : ""}`}
                  onClick={() => (multiSelect ? toggleMultiOption(opt) : handleOptionClick(opt))}
                >
                  {opt}
                </button>
              ))}
              {multiSelect && (
                <button type="button" className="btn-primary confirm-multi-btn" onClick={handleMultiConfirm}>
                  Confirmar seleção →
                </button>
              )}
            </div>
          )}
          <div className="input-row">
            <textarea
              className="chat-input"
              rows={1}
              placeholder={placeholder}
              value={inputValue}
              maxLength={maxChars}
              disabled={!inputEnabled}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button type="button" className="send-btn-chat" disabled={!inputEnabled} onClick={handleSend}>
              <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z" /></svg>
            </button>
          </div>
        </div>
      </div>

      {summaryVisible && finalUserData && (
        <div className="summary-overlay">
          <div className="summary-page">
            <div className="summary-header">
              <div className="section-tag">Pronto!</div>
              <h2>
                Seu pedido de <em>orçamento</em>
              </h2>
              <p className="summary-note">Revise as informações abaixo e envie para nossa equipe via WhatsApp.</p>
            </div>

            <div className="summary-card">
              <h3>Dados pessoais</h3>
              <div className="summary-row"><span>Nome</span><span>{finalUserData.nome || "—"}</span></div>
              <div className="summary-row"><span>Telefone</span><span>{finalUserData.tel || "—"}</span></div>
              <div className="summary-row"><span>Endereço</span><span>{finalUserData.end || "—"}</span></div>
              <div className="summary-row"><span>Tipo de imóvel</span><span>{finalUserData.tipo || "—"}</span></div>
              <div className="summary-row"><span>Visita técnica</span><span>{finalUserData.visita || "—"}</span></div>
            </div>

            <div className="summary-card">
              <h3>Projeto</h3>
              <div className="summary-row"><span>Ambiente</span><span>{finalUserData.ambiente || "—"}</span></div>
              <div className="summary-row"><span>Cor preferida</span><span>{finalUserData.cor || "—"}</span></div>
              <div className="summary-row"><span>Estilo</span><span>{finalUserData.estilo || "—"}</span></div>
              {finalUserData.ambiente.includes("Quarto") && finalUserData.cama && (
                <div className="summary-row"><span>Tamanho da cama</span><span>{finalUserData.cama}</span></div>
              )}
            </div>

            {hasEquip && (
              <div className="summary-card">
                <h3>Equipamentos</h3>
                {finalUserData.geladeira && (
                  <div className="summary-row"><span>Geladeira</span><span>{finalUserData.geladeira}</span></div>
                )}
                {finalUserData.fogao && (
                  <div className="summary-row"><span>Fogão / Cooktop</span><span>{finalUserData.fogao}</span></div>
                )}
                {finalUserData.microondas && (
                  <div className="summary-row"><span>Microondas</span><span>{finalUserData.microondas}</span></div>
                )}
                {finalUserData.coifa && (
                  <div className="summary-row"><span>Coifa/Depurador</span><span>{finalUserData.coifa}</span></div>
                )}
                {finalUserData.maquina && (
                  <div className="summary-row"><span>Máquina de lavar</span><span>{finalUserData.maquina}</span></div>
                )}
              </div>
            )}

            <button type="button" className="whats-btn" onClick={handleWhatsApp}>
              <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              Enviar para a equipe Novaes via WhatsApp
            </button>
            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <button type="button" className="btn-secondary" onClick={() => setSummaryVisible(false)}>
                Voltar e editar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
