"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShieldX } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { GrupoView } from "@/components/grupo-view";
import { EmptyState, Spinner } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { Evento, Grupo, MembroComPerfil, Mensagem, Profile } from "@/lib/types";

type Dados = {
  grupo: Grupo;
  isAdmin: boolean;
  membros: MembroComPerfil[];
  eventos: Evento[];
  mensagens: Mensagem[];
  perfis: Record<string, Profile>;
};

export default function GrupoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { userId } = useAuth();
  const [dados, setDados] = useState<Dados | null>(null);
  const [negado, setNegado] = useState(false);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const supabase = createClient();
      const [{ data: grupo }, { data: vinculo }] = await Promise.all([
        supabase.from("grupos").select("*").eq("id", id).maybeSingle(),
        supabase.from("grupo_membros").select("id, is_admin, status").eq("grupo_id", id).eq("usuario_id", userId).maybeSingle(),
      ]);
      if (!grupo) {
        router.replace("/grupos");
        return;
      }
      if (!vinculo || vinculo.status !== "ativo") {
        if (ativo) setNegado(true);
        return;
      }
      const [{ data: membrosData }, { data: eventosData }, { data: mensagensData }] = await Promise.all([
        supabase
          .from("grupo_membros")
          .select("id, grupo_id, usuario_id, is_admin, status, criado_em, profiles(id, nome, tag, foto, criado_em)")
          .eq("grupo_id", id)
          .order("criado_em"),
        supabase.from("eventos").select("*, presencas(*)").eq("grupo_id", id).order("data_evento").order("hora_evento"),
        supabase
          .from("mensagens")
          .select("*, profiles(id, nome, tag, foto, criado_em)")
          .eq("grupo_id", id)
          .order("criado_em", { ascending: true })
          .limit(150),
      ]);
      if (!ativo) return;
      const membros = (membrosData ?? []) as unknown as MembroComPerfil[];
      const mensagens = (mensagensData ?? []) as unknown as Mensagem[];
      const perfis: Record<string, Profile> = {};
      membros.forEach((m) => { if (m.profiles) perfis[m.usuario_id] = m.profiles; });
      mensagens.forEach((m) => { if (m.profiles && !perfis[m.usuario_id]) perfis[m.usuario_id] = m.profiles; });
      setDados({
        grupo: grupo as Grupo,
        isAdmin: vinculo.is_admin,
        membros,
        eventos: (eventosData ?? []) as unknown as Evento[],
        mensagens,
        perfis,
      });
    })();
    return () => { ativo = false; };
  }, [id, userId, router]);

  if (negado) {
    return (
      <EmptyState
        titulo="Acesso negado 🚫"
        descricao="Você precisa ser membro deste grupo para ver seu conteúdo. Peça um código de convite."
        icone={<ShieldX size={28} />}
        acao={<Link href="/grupos/entrar" className="btn-primary">Entrar com código</Link>}
      />
    );
  }
  if (!dados) return <Spinner />;

  return (
    <GrupoView
      grupo={dados.grupo}
      membroAtual={{ is_admin: dados.isAdmin, status: "ativo" }}
      membros={dados.membros}
      eventos={dados.eventos}
      mensagens={dados.mensagens}
      perfis={dados.perfis}
      usuarioId={userId}
    />
  );
}
