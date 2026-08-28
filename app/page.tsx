import { createClient } from "@/lib/supabase/server";
import { portfolioImageUrl } from "@/lib/supabase/storage";
import LandingApp from "@/components/landing/LandingApp";
import type { DbPortfolioItem } from "@/components/landing/portfolio-data";

// Server Component: lê os projetos publicados direto do Supabase (RLS
// permite anon ler onde published = true — ver supabase/schema.sql) e
// repassa pra landing. Enquanto o painel não tiver fotos reais publicadas,
// cada seção cai de volta nas imagens fixas do protótipo original.
async function fetchPublishedPortfolio(): Promise<DbPortfolioItem[]> {
  // A landing pública não pode cair por causa disso: sem Supabase
  // configurado ainda (dev local antes do setup) ou numa instabilidade
  // pontual do serviço, simplesmente não há itens — as páginas caem de
  // volta nas imagens do protótipo (ver HomePage/PortfolioPage).
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return [];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("portfolio_items")
      .select("id, title, description, category, image_path")
      .eq("published", true)
      .order("display_order", { ascending: true });

    if (error || !data) return [];

    return data
      .filter((item) => item.image_path)
      .map((item) => ({
        id: item.id,
        src: portfolioImageUrl(item.image_path as string),
        alt: item.title,
        label: item.title,
        category: item.category,
      }));
  } catch {
    return [];
  }
}

export default async function LandingPage() {
  const dbPortfolio = await fetchPublishedPortfolio();
  return <LandingApp dbPortfolio={dbPortfolio} />;
}
