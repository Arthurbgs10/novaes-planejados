import { z } from "zod";

// Compartilhado entre os formulários client-side (feedback imediato) e as
// Server Actions (fonte da verdade — a checagem client-side nunca é
// confiada sozinha).

export const LEAD_STATUS_VALUES = [
  "lead", "orcamento_enviado", "aprovado", "em_producao", "instalado", "perdido",
] as const;
export type LeadStatus = (typeof LEAD_STATUS_VALUES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  lead: "Lead",
  orcamento_enviado: "Orçamento enviado",
  aprovado: "Aprovado",
  em_producao: "Em produção",
  instalado: "Instalado",
  perdido: "Perdido",
};

export const ENVIRONMENT_OPTIONS = ["Cozinha", "Quarto", "Sala", "Banheiro", "Lavanderia", "Escritório"] as const;

// Mesmo vocabulário de cômodo usado nos leads, + "Projeto 3D" (renders),
// usado pra categorizar os cards do portfólio — tanto no painel (dropdown,
// em vez de texto livre) quanto nos filtros da galeria pública, que são
// gerados a partir do campo "category" de cada item.
export const PORTFOLIO_CATEGORY_OPTIONS = [...ENVIRONMENT_OPTIONS, "Projeto 3D"] as const;

export const VISIT_TYPE_VALUES = ["medicao", "instalacao", "outra"] as const;
export type VisitType = (typeof VISIT_TYPE_VALUES)[number];
export const VISIT_TYPE_LABELS: Record<VisitType, string> = {
  medicao: "Medição", instalacao: "Instalação", outra: "Outra",
};

export const VISIT_STATUS_VALUES = ["agendada", "realizada", "cancelada"] as const;
export type VisitStatus = (typeof VISIT_STATUS_VALUES)[number];
export const VISIT_STATUS_LABELS: Record<VisitStatus, string> = {
  agendada: "Agendada", realizada: "Realizada", cancelada: "Cancelada",
};

function numberField(message: string) {
  return z.string().trim().default("").transform((v) => (v === "" ? null : Number(v)))
    .refine((v) => v === null || (!Number.isNaN(v) && v >= 0), message);
}

export const leadFormSchema = z.object({
  name: z.string().trim().min(1, "Preencha o nome.").max(120, "Nome muito longo."),
  phone: z
    .string().trim().default("")
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v === "" || (v.length >= 10 && v.length <= 15), "Telefone inválido — use DDI + DDD + número."),
  address: z.string().trim().max(240, "Texto muito longo.").default(""),
  propertyType: z.string().trim().max(40, "Texto muito longo.").default(""),
  environments: z.array(z.string()).default([]),
  applianceGeladeira: z.string().trim().max(160).default(""),
  applianceFogao: z.string().trim().max(160).default(""),
  applianceMicroondas: z.string().trim().max(160).default(""),
  applianceCoifa: z.string().trim().max(160).default(""),
  applianceMaquina: z.string().trim().max(160).default(""),
  applianceCama: z.string().trim().max(60).default(""),
  designStyle: z.string().trim().max(120).default(""),
  colorPreference: z.string().trim().max(120).default(""),
  wantsTechnicalVisit: z.boolean().default(false),
  status: z.enum(LEAD_STATUS_VALUES).default("lead"),
  budgetValue: numberField("Valor de orçamento inválido."),
  paymentMethod: z.string().trim().max(60).default(""),
  installments: z
    .string().trim().default("")
    .transform((v) => (v === "" ? null : parseInt(v, 10)))
    .refine((v) => v === null || (Number.isInteger(v) && v >= 0), "Número de parcelas inválido."),
  amountReceived: z
    .string().trim().default("0")
    .transform((v) => (v === "" ? 0 : Number(v)))
    .refine((v) => !Number.isNaN(v) && v >= 0, "Valor recebido inválido."),
  notes: z.string().trim().max(4000, "Notas muito longas.").default(""),
});
export type LeadFormValues = z.infer<typeof leadFormSchema>;

export const visitFormSchema = z.object({
  leadId: z.string().uuid("Selecione um lead."),
  type: z.enum(VISIT_TYPE_VALUES).default("medicao"),
  scheduledAt: z.string().trim().min(1, "Escolha data e hora."),
  status: z.enum(VISIT_STATUS_VALUES).default("agendada"),
  notes: z.string().trim().max(2000).default(""),
});
export type VisitFormValues = z.infer<typeof visitFormSchema>;

export const portfolioItemFormSchema = z.object({
  title: z.string().trim().min(1, "Dê um título ao projeto.").max(160),
  description: z.string().trim().max(2000).default(""),
  category: z.string().trim().max(60).default(""),
  displayOrder: z
    .string().trim().default("0")
    .transform((v) => (v === "" ? 0 : parseInt(v, 10)))
    .refine((v) => Number.isInteger(v), "Ordem inválida."),
  published: z.boolean().default(false),
});
export type PortfolioItemFormValues = z.infer<typeof portfolioItemFormSchema>;

// Dados coletados pelo chat da Nina (landing pública, sem login) — ver
// components/landing/chat/flow.ts para o roteiro completo.
export const chatLeadSchema = z.object({
  nome: z.string().trim().min(1).max(120),
  tel: z.string().trim().max(30).default(""),
  end: z.string().trim().max(240).default(""),
  tipo: z.string().trim().max(40).default(""),
  ambiente: z.string().trim().max(200).default(""),
  cor: z.string().trim().max(80).default(""),
  estilo: z.string().trim().max(120).default(""),
  visita: z.string().trim().max(10).default(""),
  geladeira: z.string().trim().max(160).default(""),
  fogao: z.string().trim().max(160).default(""),
  microondas: z.string().trim().max(160).default(""),
  coifa: z.string().trim().max(160).default(""),
  maquina: z.string().trim().max(160).default(""),
  cama: z.string().trim().max(60).default(""),
});
export type ChatLeadValues = z.infer<typeof chatLeadSchema>;
