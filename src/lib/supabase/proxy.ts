import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_AUTH = ["/login", "/cadastro", "/esqueci-senha", "/redefinir-senha"];
const PRIVADO = ["/dashboard", "/grupos", "/cronograma", "/perfil"];

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  let user = null;
  try {
    user = (await supabase.auth.getUser()).data.user;
  } catch {
    // Sessão inválida: trata como visitante.
  }

  const path = request.nextUrl.pathname;
  const copiarCookies = (destino: NextResponse) => {
    response.cookies.getAll().forEach((c) => destino.cookies.set(c.name, c.value, c));
    return destino;
  };

  if (!user && PRIVADO.some((p) => path.startsWith(p))) {
    return copiarCookies(NextResponse.redirect(new URL("/login", request.url)));
  }
  if (user && PUBLIC_AUTH.some((p) => path.startsWith(p))) {
    return copiarCookies(NextResponse.redirect(new URL("/dashboard", request.url)));
  }
  if (path === "/") {
    return copiarCookies(
      NextResponse.redirect(new URL(user ? "/dashboard" : "/login", request.url)),
    );
  }

  return response;
}
