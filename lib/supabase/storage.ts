// URL pública de um arquivo no bucket "portfolio" (bucket público — ver
// supabase/schema.sql). NEXT_PUBLIC_SUPABASE_URL é seguro de usar tanto no
// servidor quanto no cliente.
export function portfolioImageUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/portfolio/${path}`;
}
