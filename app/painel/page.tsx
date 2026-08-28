import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardApp from "@/components/painel/DashboardApp";
import type { LeadRecord, VisitRecord, PortfolioItemRecord } from "@/lib/types";

export const metadata = {
  title: "Painel — Novaes Planejados",
};

// Middleware já protege qualquer request a /painel, mas a sessão é
// checada de novo aqui: um Server Component nunca deve assumir que o
// request na frente dele já foi filtrado, só a config de rota que roda
// antes.
export default async function PainelPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/painel/login");
  }

  const [{ data: leads }, { data: visits }, { data: portfolioItems }] = await Promise.all([
    supabase.from("leads").select("*").order("created_at", { ascending: false }),
    supabase.from("visits").select("*").order("scheduled_at", { ascending: true }),
    supabase.from("portfolio_items").select("*").order("display_order", { ascending: true }),
  ]);

  return (
    <DashboardApp
      initialLeads={(leads ?? []) as LeadRecord[]}
      initialVisits={(visits ?? []) as VisitRecord[]}
      initialPortfolioItems={(portfolioItems ?? []) as PortfolioItemRecord[]}
      userEmail={user.email ?? ""}
    />
  );
}
