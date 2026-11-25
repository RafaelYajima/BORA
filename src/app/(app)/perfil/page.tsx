"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, Mail, MessageCircle, Pencil, Ticket, Trophy, Users } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { FotoUpload } from "@/components/foto-upload";
import { PageHeader, Spinner } from "@/components/ui";
import { selosGlobais } from "@/lib/pontuacao";
import { createClient } from "@/lib/supabase/client";

export default function PerfilPage() {
  const { userId, email, perfil } = useAuth();
  const [contagens, setContagens] = useState<{ grupos: number; eventos: number; confirmadas: number; mensagens: number } | null>(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const supabase = createClient();
      const [{ count: grupos }, { count: eventos }, { count: confirmadas }, { count: mensagens }] = await Promise.all([
        supabase.from("grupo_membros").select("id", { count: "exact", head: true }).eq("usuario_id", userId).eq("status", "ativo"),
        supabase.from("eventos").select("id", { count: "exact", head: true }).eq("criador_id", userId),
        supabase.from("presencas").select("id", { count: "exact", head: true }).eq("usuario_id", userId).eq("status", "vou"),
        supabase.from("mensagens").select("id", { count: "exact", head: true }).eq("usuario_id", userId),
      ]);
      if (ativo) setContagens({ grupos: grupos ?? 0, eventos: eventos ?? 0, confirmadas: confirmadas ?? 0, mensagens: mensagens ?? 0 });
    })();
    return () => { ativo = false; };
  }, [userId]);

  const nome = perfil.nome;
  const desde = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(perfil.criado_em));
  const pontos = contagens
    ? contagens.grupos * 5 + contagens.eventos * 10 + contagens.confirmadas * 5 + Math.min(contagens.mensagens, 10) * 2
    : 0;
  const selos = contagens ? selosGlobais(contagens.grupos, contagens.eventos, contagens.confirmadas, pontos) : [];

  return (
    <>
      <PageHeader
        titulo="Meu perfil"
        subtitulo="Seus dados e um resumo da sua participação."
        acoes={<Link href="/perfil/editar" className="btn-primary"><Pencil size={16} /> Editar perfil</Link>}
      />

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className="card p-6 text-center">
          <FotoUpload usuarioId={userId} nome={nome} foto={perfil.foto} />
          <h2 className="font-display mt-5 text-2xl font-extrabold text-ink">{nome}</h2>
          <p className="font-semibold text-primary">{perfil.tag}</p>
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted"><Mail size={15} /> {email}</p>
          <p className="mt-1 text-xs text-muted">No BORA desde {desde}</p>
        </section>

        <div className="space-y-6">
          {!contagens ? <Spinner /> : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { rotulo: "Grupos", valor: contagens.grupos, icone: Users },
                { rotulo: "Eventos criados", valor: contagens.eventos, icone: CalendarDays },
                { rotulo: "Presenças confirmadas", valor: contagens.confirmadas, icone: Ticket },
                { rotulo: "Pontos", valor: pontos, icone: Trophy },
              ].map(({ rotulo, valor, icone: Icone }) => (
                <div key={rotulo} className="card p-5">
                  <Icone size={19} className="text-primary" />
                  <p className="font-display mt-2 text-2xl font-extrabold text-ink">{valor}</p>
                  <p className="text-xs text-muted">{rotulo}</p>
                </div>
              ))}
            </div>
          )}

          <section className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="section-title">Seus selos</h3>
              <span className="inline-flex items-center gap-1 text-xs text-muted"><MessageCircle size={14} /> {contagens?.mensagens ?? 0} mensagens</span>
            </div>
            {selos.length ? (
              <div className="flex flex-wrap gap-2">
                {selos.map((selo) => (
                  <span key={selo.id} title={selo.descricao} className="chip bg-soft text-ink">{selo.emoji} {selo.nome}</span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Crie um evento ou confirme presença para ganhar seu primeiro selo.</p>
            )}
          </section>

          <section className="card p-6">
            <h3 className="section-title mb-4">Informações</h3>
            <dl className="divide-y divide-line text-sm">
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-muted">Nome</dt><dd className="font-semibold text-ink">{nome}</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-muted">Tag</dt><dd className="font-semibold text-ink">{perfil.tag}</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-muted">E-mail</dt><dd className="break-all text-right font-semibold text-ink">{email}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </>
  );
}
