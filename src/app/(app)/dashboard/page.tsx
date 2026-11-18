"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, ChevronRight, Plus, Ticket, Users } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { GrupoCard } from "@/components/grupo-card";
import { ListaEventos } from "@/components/eventos-lista";
import { EmptyState, PageHeader, Spinner } from "@/components/ui";
import { hojeISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { EventoComGrupo, Grupo } from "@/lib/types";

type Dados = {
  nome: string;
  grupos: (Grupo & { admin: boolean })[];
  totalMembros: Record<string, number>;
  eventos: EventoComGrupo[];
  totalPresencas: number;
};

export default function DashboardPage() {
  const { userId } = useAuth();
  const [dados, setDados] = useState<Dados | null>(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const supabase = createClient();
      const [{ data: perfil }, { data: vinculos }] = await Promise.all([
        supabase.from("profiles").select("nome").eq("id", userId).maybeSingle(),
        supabase.from("grupo_membros").select("grupo_id, is_admin, grupos(*)").eq("usuario_id", userId).eq("status", "ativo"),
      ]);
      const grupos = ((vinculos ?? []) as unknown as { grupo_id: string; is_admin: boolean; grupos: Grupo | null }[])
        .map((v) => ({ ...(v.grupos as Grupo), admin: v.is_admin }))
        .filter((g) => g && g.id);
      const ids = grupos.map((g) => g.id);

      const [{ data: eventosData }, { count: totalPresencas }, contagens] = await Promise.all([
        ids.length
          ? supabase
              .from("eventos")
              .select("*, grupos(id, nome), presencas(*)")
              .in("grupo_id", ids)
              .gte("data_evento", hojeISO())
              .order("data_evento")
              .order("hora_evento")
              .limit(5)
          : Promise.resolve({ data: [] }),
        supabase.from("presencas").select("id", { count: "exact", head: true }).eq("usuario_id", userId),
        Promise.all(
          grupos.map(async (g) => {
            const { count } = await supabase
              .from("grupo_membros")
              .select("id", { count: "exact", head: true })
              .eq("grupo_id", g.id)
              .eq("status", "ativo");
            return [g.id, count ?? 0] as const;
          }),
        ),
      ]);

      if (!ativo) return;
      setDados({
        nome: perfil?.nome ?? "Participante",
        grupos,
        totalMembros: Object.fromEntries(contagens),
        eventos: (eventosData ?? []) as EventoComGrupo[],
        totalPresencas: totalPresencas ?? 0,
      });
    })();
    return () => { ativo = false; };
  }, [userId]);

  if (!dados) return <Spinner />;
  const primeiroNome = dados.nome.split(" ")[0];

  return (
    <>
      <PageHeader
        titulo={`Olá, ${primeiroNome}! 👋`}
        subtitulo="Aqui está o que está acontecendo com seus grupos."
        acoes={
          <>
            <Link href="/grupos/entrar" className="btn-secondary"><Ticket size={16} /> Entrar com código</Link>
            <Link href="/grupos/novo" className="btn-primary"><Plus size={16} /> Criar grupo</Link>
          </>
        }
      />

      <section className="animate-in relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-primary to-cyan-500 p-6 text-white shadow-xl shadow-primary/20 sm:p-8">
        <div className="relative z-10 max-w-lg">
          <p className="text-sm font-semibold text-white/80">BORA 2.0</p>
          <h2 className="font-display mt-1 text-2xl font-extrabold leading-tight sm:text-3xl">Seus planos começam aqui.</h2>
          <p className="mt-2 text-sm text-white/85">Crie eventos, confirme presença e mantenha todo mundo na mesma página.</p>
          <Link href="/cronograma" className="mt-5 inline-flex items-center gap-1 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-bold backdrop-blur transition hover:bg-white/30">
            Ver cronograma <ChevronRight size={16} />
          </Link>
        </div>
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 right-32 h-48 w-48 rounded-full bg-cyan-200/20 blur-2xl" />
      </section>

      <div className="mb-8 grid grid-cols-3 gap-3">
        {[
          { rotulo: "Grupos", valor: dados.grupos.length, icone: Users, cor: "text-primary" },
          { rotulo: "Próximos", valor: dados.eventos.length, icone: CalendarDays, cor: "text-warning" },
          { rotulo: "Respostas", valor: dados.totalPresencas, icone: Ticket, cor: "text-success" },
        ].map(({ rotulo, valor, icone: Icone, cor }) => (
          <div key={rotulo} className="card p-4 sm:p-5">
            <Icone size={18} className={cor} />
            <p className="font-display mt-2 text-2xl font-extrabold text-ink">{valor}</p>
            <p className="text-xs text-muted">{rotulo}</p>
          </div>
        ))}
      </div>

      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title">Meus grupos</h2>
          <Link href="/grupos" className="text-sm font-semibold text-primary hover:underline">Ver todos</Link>
        </div>
        {dados.grupos.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dados.grupos.slice(0, 6).map((grupo) => (
              <GrupoCard key={grupo.id} grupo={grupo} totalMembros={dados.totalMembros[grupo.id] ?? 0} admin={grupo.admin} />
            ))}
          </div>
        ) : (
          <EmptyState
            titulo="Você ainda não tem grupos"
            descricao="Crie um grupo ou entre em um usando o código de convite."
            icone={<Users size={26} />}
            acao={<Link href="/grupos/novo" className="btn-primary">Criar meu primeiro grupo</Link>}
          />
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title">Próximos eventos</h2>
          <Link href="/cronograma" className="text-sm font-semibold text-primary hover:underline">Ver agenda completa</Link>
        </div>
        <ListaEventos eventos={dados.eventos} usuarioId={userId} mostrarGrupo mensagemVazia="Nenhum evento próximo. Bora agendar um!" />
      </section>
    </>
  );
}
