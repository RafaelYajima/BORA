"use client";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente do navegador. Usamos o @supabase/supabase-js puro (sessão em
 * localStorage) em vez do @supabase/ssr: o preview roda em iframe e cookies
 * de terceiros podem ser bloqueados, o que faria a sessão "sumir" entre
 * navegações e derrubar o usuário para o login.
 */
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  );
}
