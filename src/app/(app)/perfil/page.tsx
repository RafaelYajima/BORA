"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, Mail, Pencil, Ticket, Users } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { FotoUpload } from "@/components/foto-upload";
import { PageHeader, Spinner } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export default function PerfilPage() {
  const { userId, email, perfil } = useAuth();
  const [contagens, setContagens] = useState<{ grupos: number; eventos: number; respostas: number } | null>(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const supabase = createClient();
      const [{ count: grupos }, { count: eventos }, { count: respostas }] = await Promise.all([
        supabase.from("grupo_membros").select("id", { count: "exact", head: true }).eq("usuario_id", userId).eq("status", "ativo"),
        supabase.from("eventos").select("id", { count: "exact", head: true }).eq("criador_id", userId),
        supabase.from("presencas").select("id", { count: "exact", head: true }).eq("usuario_id", userId),
      ]);
      if (ativo) setContagens({ grupos: grupos ?? 0, eventos: eventos ?? 0, respostas: respostas ?? 0 });
    })();
    return () => { ativo = false; };
  }, [userId]);

  const nome = perfil.nome;
  const desde = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(perfil.criado_em));

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
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { rotulo: "Grupos", valor: contagens.grupos, icone: Users },
                { rotulo: "Eventos criados", valor: contagens.eventos, icone: CalendarDays },
                { rotulo: "Respostas dadas", valor: contagens.respostas, icone: Ticket },
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
