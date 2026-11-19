"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarDays, Home, LogOut, Moon, Plus, Sun, Users, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, Logo } from "@/components/ui";

type Usuario = { nome: string; tag: string; foto: string | null; email?: string };

const LINKS = [
  { href: "/dashboard", label: "Início", icone: Home },
  { href: "/grupos", label: "Grupos", icone: Users },
  { href: "/cronograma", label: "Agenda", icone: CalendarDays },
  { href: "/perfil", label: "Perfil", icone: UserRound },
];

function alternarTema() {
  const escuro = document.documentElement.classList.toggle("dark");
  try {
    localStorage.setItem("bora2-tema", escuro ? "escuro" : "claro");
  } catch {
    // armazenamento indisponível
  }
}

export function Shell({ usuario, children }: { usuario: Usuario; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState(false);

  async function sair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const ativo = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-screen pb-24 lg:pb-0">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden items-center gap-1 lg:flex">
              {LINKS.map(({ href, label, icone: Icone }) => (
                <Link
                  key={href}
                  href={href}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    ativo(href) ? "bg-primary/10 text-primary" : "text-muted hover:bg-soft hover:text-ink"
                  }`}
                >
                  <Icone size={16} />
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/grupos/novo" className="btn-primary hidden sm:inline-flex">
              <Plus size={16} /> Novo grupo
            </Link>
            <button
              onClick={alternarTema}
              aria-label="Alternar tema"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-muted transition hover:bg-soft hover:text-ink"
            >
              <Moon size={19} className="dark:hidden" /><Sun size={19} className="hidden dark:block" />
            </button>
            <div className="relative">
              <button onClick={() => setMenu(!menu)} aria-label="Abrir menu do perfil" className="flex items-center gap-2 rounded-full p-0.5 transition hover:ring-2 hover:ring-primary/40">
                <Avatar nome={usuario.nome} foto={usuario.foto} tamanho={36} />
              </button>
              {menu && (
                <>
                  <button className="fixed inset-0 z-10 cursor-default" aria-label="Fechar menu" onClick={() => setMenu(false)} />
                  <div className="card absolute right-0 top-12 z-20 w-60 animate-in p-2 shadow-xl">
                    <div className="border-b border-line px-3 py-2">
                      <p className="truncate text-sm font-bold text-ink">{usuario.nome}</p>
                      <p className="text-xs text-muted">{usuario.tag} · {usuario.email}</p>
                    </div>
                    <Link href="/perfil" onClick={() => setMenu(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-soft">
                      <UserRound size={16} /> Meu perfil
                    </Link>
                    <button onClick={alternarTema} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-soft">
                      <Moon size={16} className="dark:hidden" /><Sun size={16} className="hidden dark:block" /><span className="dark:hidden">Modo escuro</span><span className="hidden dark:inline">Modo claro</span>
                    </button>
                    <button onClick={sair} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-danger hover:bg-danger/10">
                      <LogOut size={16} /> Sair
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-surface/95 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
          {LINKS.map(({ href, label, icone: Icone }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold transition ${
                ativo(href) ? "text-primary" : "text-muted"
              }`}
            >
              <Icone size={21} strokeWidth={ativo(href) ? 2.5 : 1.8} />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
