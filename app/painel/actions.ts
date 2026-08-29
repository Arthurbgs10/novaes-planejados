"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { leadFormSchema, visitFormSchema, portfolioItemFormSchema } from "@/lib/validation";
import type { LeadRecord, VisitRecord, PortfolioItemRecord } from "@/lib/types";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

// Every write goes through here, never straight from the browser: input is
// re-validated server-side (client-side checks are only for immediate
// feedback), and every Supabase call carries the caller's session so it's
// still bound by the RLS policies in supabase/schema.sql — no service_role
// key is used anywhere in this app.
async function getAuthedSupabase() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? supabase : null;
}

/* ------------------------------ leads ------------------------------ */

function leadToRow(values: ReturnType<typeof leadFormSchema.parse>) {
  return {
    name: values.name,
    phone: values.phone || null,
    address: values.address || null,
    property_type: values.propertyType || null,
    environments: values.environments,
    appliance_details: {
      geladeira: values.applianceGeladeira || undefined,
      fogao: values.applianceFogao || undefined,
      microondas: values.applianceMicroondas || undefined,
      coifa: values.applianceCoifa || undefined,
      maquina: values.applianceMaquina || undefined,
      cama: values.applianceCama || undefined,
    },
    design_style: values.designStyle || null,
    color_preference: values.colorPreference || null,
    wants_technical_visit: values.wantsTechnicalVisit,
    status: values.status,
    budget_value: values.budgetValue,
    payment_method: values.paymentMethod || null,
    installments: values.installments,
    amount_received: values.amountReceived,
    notes: values.notes || null,
  };
}

export async function createLeadAction(input: unknown): Promise<ActionResult<LeadRecord>> {
  const parsed = leadFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await getAuthedSupabase();
  if (!supabase) return { ok: false, error: "Sessão expirada. Faça login novamente." };

  const { data, error } = await supabase
    .from("leads")
    .insert({ ...leadToRow(parsed.data), source: "manual" })
    .select()
    .single();

  if (error || !data) return { ok: false, error: "Não foi possível salvar. Tente novamente." };

  revalidatePath("/painel");
  return { ok: true, data: data as LeadRecord };
}

export async function updateLeadAction(id: string, input: unknown): Promise<ActionResult<LeadRecord>> {
  if (!id) return { ok: false, error: "Lead inválido." };

  const parsed = leadFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await getAuthedSupabase();
  if (!supabase) return { ok: false, error: "Sessão expirada. Faça login novamente." };

  const { data, error } = await supabase
    .from("leads")
    .update(leadToRow(parsed.data))
    .eq("id", id)
    .select()
    .single();

  if (error || !data) return { ok: false, error: "Não foi possível salvar. Tente novamente." };

  revalidatePath("/painel");
  return { ok: true, data: data as LeadRecord };
}

export async function deleteLeadAction(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!id) return { ok: false, error: "Lead inválido." };

  const supabase = await getAuthedSupabase();
  if (!supabase) return { ok: false, error: "Sessão expirada. Faça login novamente." };

  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) return { ok: false, error: "Não foi possível excluir. Tente novamente." };

  revalidatePath("/painel");
  return { ok: true };
}

/* ------------------------------ visitas ------------------------------ */

export async function createVisitAction(input: unknown): Promise<ActionResult<VisitRecord>> {
  const parsed = visitFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await getAuthedSupabase();
  if (!supabase) return { ok: false, error: "Sessão expirada. Faça login novamente." };

  const { data, error } = await supabase
    .from("visits")
    .insert({
      lead_id: parsed.data.leadId,
      type: parsed.data.type,
      // Já chega em ISO UTC (convertido no navegador — ver VisitForm.tsx):
      // reconverter aqui rodaria no fuso do servidor (UTC na Vercel), não
      // no fuso de quem preencheu o formulário.
      scheduled_at: parsed.data.scheduledAt,
      status: parsed.data.status,
      notes: parsed.data.notes || null,
    })
    .select()
    .single();

  if (error || !data) return { ok: false, error: "Não foi possível salvar. Tente novamente." };

  revalidatePath("/painel");
  return { ok: true, data: data as VisitRecord };
}

export async function updateVisitAction(id: string, input: unknown): Promise<ActionResult<VisitRecord>> {
  if (!id) return { ok: false, error: "Visita inválida." };

  const parsed = visitFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await getAuthedSupabase();
  if (!supabase) return { ok: false, error: "Sessão expirada. Faça login novamente." };

  const { data, error } = await supabase
    .from("visits")
    .update({
      lead_id: parsed.data.leadId,
      type: parsed.data.type,
      scheduled_at: parsed.data.scheduledAt,
      status: parsed.data.status,
      notes: parsed.data.notes || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) return { ok: false, error: "Não foi possível salvar. Tente novamente." };

  revalidatePath("/painel");
  return { ok: true, data: data as VisitRecord };
}

export async function deleteVisitAction(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!id) return { ok: false, error: "Visita inválida." };

  const supabase = await getAuthedSupabase();
  if (!supabase) return { ok: false, error: "Sessão expirada. Faça login novamente." };

  const { error } = await supabase.from("visits").delete().eq("id", id);
  if (error) return { ok: false, error: "Não foi possível excluir. Tente novamente." };

  revalidatePath("/painel");
  return { ok: true };
}

/* ------------------------------ portfólio ------------------------------ */

function parsePortfolioFields(formData: FormData) {
  return portfolioItemFormSchema.safeParse({
    title: String(formData.get("title") || ""),
    description: String(formData.get("description") || ""),
    category: String(formData.get("category") || ""),
    displayOrder: String(formData.get("displayOrder") || "0"),
    published: formData.get("published") === "on",
  });
}

function fileExtension(name: string) {
  const ext = name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  return ext || "jpg";
}

export async function createPortfolioItemAction(formData: FormData): Promise<ActionResult<PortfolioItemRecord>> {
  const parsed = parsePortfolioFields(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await getAuthedSupabase();
  if (!supabase) return { ok: false, error: "Sessão expirada. Faça login novamente." };

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Selecione uma imagem." };
  }
  if (!file.type.startsWith("image/")) return { ok: false, error: "O arquivo precisa ser uma imagem." };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: "Imagem muito grande (máx. 8MB)." };

  const path = `${crypto.randomUUID()}.${fileExtension(file.name)}`;
  const { error: uploadError } = await supabase.storage
    .from("portfolio")
    .upload(path, file, { contentType: file.type });
  if (uploadError) return { ok: false, error: "Não foi possível enviar a imagem." };

  const { data, error } = await supabase
    .from("portfolio_items")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description || null,
      category: parsed.data.category || null,
      image_path: path,
      display_order: parsed.data.displayOrder,
      published: parsed.data.published,
    })
    .select()
    .single();

  if (error || !data) return { ok: false, error: "Não foi possível salvar." };

  revalidatePath("/painel");
  revalidatePath("/");
  return { ok: true, data: data as PortfolioItemRecord };
}

export async function updatePortfolioItemAction(
  id: string,
  formData: FormData
): Promise<ActionResult<PortfolioItemRecord>> {
  if (!id) return { ok: false, error: "Item inválido." };

  const parsed = parsePortfolioFields(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await getAuthedSupabase();
  if (!supabase) return { ok: false, error: "Sessão expirada. Faça login novamente." };

  let imagePath: string | undefined;
  let previousImagePath: string | null = null;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/")) return { ok: false, error: "O arquivo precisa ser uma imagem." };
    if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: "Imagem muito grande (máx. 8MB)." };

    const { data: existing } = await supabase
      .from("portfolio_items")
      .select("image_path")
      .eq("id", id)
      .single();
    previousImagePath = existing?.image_path ?? null;

    imagePath = `${crypto.randomUUID()}.${fileExtension(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from("portfolio")
      .upload(imagePath, file, { contentType: file.type });
    if (uploadError) return { ok: false, error: "Não foi possível enviar a imagem." };
  }

  const { data, error } = await supabase
    .from("portfolio_items")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      category: parsed.data.category || null,
      display_order: parsed.data.displayOrder,
      published: parsed.data.published,
      ...(imagePath ? { image_path: imagePath } : {}),
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) return { ok: false, error: "Não foi possível salvar." };

  // A foto antiga só é removida depois que a nova já está salva no registro
  // — assim, se o update tivesse falhado, o card continuaria apontando pra
  // uma imagem que ainda existe no bucket.
  if (previousImagePath) {
    await supabase.storage.from("portfolio").remove([previousImagePath]);
  }

  revalidatePath("/painel");
  revalidatePath("/");
  return { ok: true, data: data as PortfolioItemRecord };
}

export async function setPortfolioItemPublishedAction(
  id: string,
  published: boolean
): Promise<ActionResult<PortfolioItemRecord>> {
  const supabase = await getAuthedSupabase();
  if (!supabase) return { ok: false, error: "Sessão expirada. Faça login novamente." };

  const { data, error } = await supabase
    .from("portfolio_items")
    .update({ published })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) return { ok: false, error: "Não foi possível atualizar." };

  revalidatePath("/painel");
  revalidatePath("/");
  return { ok: true, data: data as PortfolioItemRecord };
}

export async function deletePortfolioItemAction(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!id) return { ok: false, error: "Item inválido." };

  const supabase = await getAuthedSupabase();
  if (!supabase) return { ok: false, error: "Sessão expirada. Faça login novamente." };

  const { data: existing } = await supabase
    .from("portfolio_items")
    .select("image_path")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("portfolio_items").delete().eq("id", id);
  if (error) return { ok: false, error: "Não foi possível excluir. Tente novamente." };

  if (existing?.image_path) {
    await supabase.storage.from("portfolio").remove([existing.image_path]);
  }

  revalidatePath("/painel");
  revalidatePath("/");
  return { ok: true };
}

/* ------------------------------ sessão ------------------------------ */

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/painel/login");
}
