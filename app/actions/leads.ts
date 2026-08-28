"use server";

import { createClient } from "@/lib/supabase/server";
import { chatLeadSchema, type ChatLeadValues } from "@/lib/validation";

// Chamada pelo chat da Nina (landing pública, sem login) ao final do
// roteiro — grava o lead direto no Supabase como usuário "anon", coberto
// pela policy "anon can insert chat leads" (supabase/schema.sql): só aceita
// linhas com status='lead', source='chat' e amount_received=0, então nem um
// visitante mal-intencionado consegue inserir algo que pareça um negócio já
// fechado. Roda em paralelo com a abertura do WhatsApp no cliente — se essa
// gravação falhar, a experiência do visitante não é afetada, só o dado não
// aparece automaticamente no painel.

// Tempo mínimo de preenchimento: mesma ideia do honeypot+tempo do
// ContactForm do protótipo original, adaptada a um chat (não há campo
// isca natural numa conversa) — falha em silêncio, sem sinalizar ao
// chamador *por que* nada foi salvo, pra não dar pista a um bot. É uma
// barreira leve, não uma garantia: nada impede um cliente HTTP direto de
// forjar startedAtMs, mas isso já vale para qualquer dado client-supplied
// num endpoint público sem login — a RLS em supabase/schema.sql é a
// proteção que realmente importa.
const MIN_FILL_TIME_MS = 4000;

function splitEnvironments(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.replace(/\p{Extended_Pictographic}/gu, "").trim())
    .filter(Boolean);
}

export async function createChatLeadAction(
  input: unknown,
  startedAtMs: number
): Promise<{ ok: boolean }> {
  if (Date.now() - startedAtMs < MIN_FILL_TIME_MS) {
    return { ok: false };
  }

  const parsed = chatLeadSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const data: ChatLeadValues = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.from("leads").insert({
    name: data.nome,
    phone: data.tel || null,
    address: data.end || null,
    property_type: data.tipo || null,
    environments: splitEnvironments(data.ambiente),
    appliance_details: {
      geladeira: data.geladeira || undefined,
      fogao: data.fogao || undefined,
      microondas: data.microondas || undefined,
      coifa: data.coifa || undefined,
      maquina: data.maquina || undefined,
      cama: data.cama || undefined,
    },
    design_style: data.estilo || null,
    color_preference: data.cor || null,
    wants_technical_visit: data.visita === "Sim",
    status: "lead",
    source: "chat",
    amount_received: 0,
  });

  return { ok: !error };
}
