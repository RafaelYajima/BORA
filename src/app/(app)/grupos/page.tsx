"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Search, Ticket } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { GrupoCard } from "@/components/grupo-card";
import { EmptyState, PageHeader, Spinner } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { Grupo } from "@/lib/types";

type GrupoComAdmin = Grupo & { admin: boolean };

export default function GruposPage() {
  const { userId } = useAuth();
  const [grupos, setGrupos] = useState<GrupoComAdmin[] | null>(null);
  const [contagens, setContagens] = useState<Record<string, number>>({});

  useEffect(() => {
    let ativo = true;
    (async () => {
      const supabase = createClient();
      const { data: vinculos } = await supabase
        .from("grupo_membros")
        .select("grupo_id, is_admin, grupos(*)")
        .eq("usuario_id", userId)
        .eq("status", "ativo");
      const lista = ((vinculos ?? []) as unknown as { grupo_id: string; is_admin: boolean; grupos: Grupo | null }[])
        .map((v) => ({ ...(v.grupos as Grupo), admin: v.is_admin }))
        .filter((g) => g && g.id);
      const resultados = await Promise.all(
        lista.map(async (g) => {
          const { count } = await supabase
            .from("grupo_membros")
            .select("id", { count: "exact", head: true })
            .eq("grupo_id", g.id)
            .eq("status", "ativo");
          return [g.id, count ?? 0] as const;
        }),
      );
      if (!ativo) return;
      setGrupos(lista);
      setContagens(Object.fromEntries(resultados));
    })();
    return () => { ativo = false; };
  }, [userId]);

  return (
    <>
      <PageHeader
        titulo="Meus grupos"
        subtitulo="Todos os seus espaços em um só lugar."
        acoes={
          <>
            <Link href="/grupos/entrar" className="btn-secondary"><Search size={16} /> Entrar com código</Link>
            <Link href="/grupos/novo" className="btn-primary"><Plus size={16} /> Novo grupo</Link>
          </>
        }
      />
      {grupos === null ? <Spinner /> : grupos.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {grupos.map((grupo) => (
            <GrupoCard key={grupo.id} grupo={grupo} totalMembros={contagens[grupo.id] ?? 0} admin={grupo.admin} />
          ))}
        </div>
      ) : (
        <EmptyState
          titulo="Nenhum grupo ainda"
          descricao="Peça um código de convite a um amigo ou crie o seu próprio grupo."
          icone={<Ticket size={26} />}
          acao={
            <div className="flex gap-2">
              <Link href="/grupos/entrar" className="btn-secondary">Tenho um código</Link>
              <Link href="/grupos/novo" className="btn-primary">Criar grupo</Link>
            </div>
          }
        />
      )}
    </>
  );
}
