import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Node.js runtime (stable since Next.js 15.5): the Edge runtime's bundler
  // rejects a transitive dependency pulled in by the full Supabase client
  // that @supabase/ssr builds (auth + realtime + storage + postgrest),
  // even though this middleware only ever touches auth. Node.js runtime has
  // no such module allowlist, so the exact same session-refresh logic just
  // runs — nothing about the auth flow itself changes.
  runtime: "nodejs",
  matcher: ["/painel/:path*"],
};
