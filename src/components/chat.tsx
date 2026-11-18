"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Avatar } from "@/components/ui";
import { formatarDataHora } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { Mensagem, Profile } from "@/lib/types";

export function ChatGrupo({
  grupoId,
  usuarioId,
  perfis,
  mensagens: iniciais,
}: {
  grupoId: string;
  usuarioId: string;
  perfis: Record<string, Profile>;
  mensagens: Mensagem[];
}) {
  const [mensagens, setMensagens] = useState(iniciais);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens.length]);

  useEffect(() => {
    const supabase = createClient();
    const canal = supabase
      .channel(`chat-${grupoId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensagens", filter: `grupo_id=eq.${grupoId}` },
        async (payload) => {
          const nova = payload.new as Mensagem;
          setMensagens((lista) => (lista.some((m) => m.id === nova.id) ? lista : [...lista, nova]));
          if (!perfis[nova.usuario_id]) {
            const { data } = await supabase
              .from("profiles")
              .select("id, nome, tag, foto, criado_em")
              .eq("id", nova.usuario_id)
              .maybeSingle();
            if (data) perfis[nova.usuario_id] = data as Profile;
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [grupoId, perfis]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const conteudo = texto.trim();
    if (!conteudo) return;
    setErro("");
    setEnviando(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("mensagens")
      .insert({ grupo_id: grupoId, usuario_id: usuarioId, mensagem: conteudo })
      .select()
      .single();
    setEnviando(false);
    if (error || !data) {
      setErro(error?.message ?? "Não foi possível enviar a mensagem.");
      return;
    }
    const enviada = data as Mensagem;
    setMensagens((lista) => (lista.some((m) => m.id === enviada.id) ? lista : [...lista, enviada]));
    setTexto("");
  }

  return (
    <section className="card flex h-[32rem] flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <h3 className="section-title">💬 Mural do grupo</h3>
        <span className="text-xs font-medium text-muted">{mensagens.length} mensagem{mensagens.length === 1 ? "" : "s"}</span>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {mensagens.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">Nenhuma mensagem ainda. Diga oi! 👋</p>
        )}
        {mensagens.map((mensagem) => {
          const autor = perfis[mensagem.usuario_id];
          const meu = mensagem.usuario_id === usuarioId;
          return (
            <div key={mensagem.id} className={`flex gap-2 ${meu ? "flex-row-reverse" : ""}`}>
              <Avatar nome={autor?.nome ?? "?"} foto={autor?.foto} tamanho={30} />
              <div className={`max-w-[80%] ${meu ? "text-right" : ""}`}>
                <p className="mb-0.5 text-[11px] font-semibold text-muted">
                  {meu ? "Você" : (autor?.nome ?? "Participante")} · {formatarDataHora(mensagem.criado_em)}
                </p>
                <p className={`inline-block rounded-2xl px-3 py-2 text-left text-sm ${meu ? "rounded-tr-sm bg-primary text-white" : "rounded-tl-sm bg-soft text-ink"}`}>
                  {mensagem.mensagem}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={fim} />
      </div>

      {erro && <p className="px-4 pb-1 text-xs text-danger">{erro}</p>}
      <form onSubmit={enviar} className="flex gap-2 border-t border-line p-3">
        <input
          className="input py-2.5"
          maxLength={1000}
          placeholder="Escreva uma mensagem..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <button type="submit" disabled={enviando || !texto.trim()} aria-label="Enviar mensagem" className="btn-primary w-11 shrink-0 px-0">
          <Send size={17} />
        </button>
      </form>
    </section>
  );
}
