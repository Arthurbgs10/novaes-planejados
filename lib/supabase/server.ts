import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-side Supabase client, used from Server Components and Server
// Actions. It carries the logged-in user's session (via cookies), so every
// query it makes is subject to the RLS policies in supabase/schema.sql —
// there is no service_role key anywhere in this app.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render, where cookies can't be
            // written. Safe to ignore: middleware refreshes the session on
            // every request that hits /painel.
          }
        },
      },
    }
  );
}
