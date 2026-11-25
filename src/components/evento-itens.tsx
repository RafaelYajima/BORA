"use client";

import { useEffect, useState } from "react";
import { Check, ClipboardList, Info, Plus, Trash2 } from "lucide-react";
import { formatarDataHora } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { EventoItem } from "@/lib/types";

const CAMPOS_SEM_PERFIL = "id, evento_id, usuario_id, sugerido_por, nome, quantidade, criado_em";
const CAMPOS = `${CAMPOS_SEM_PERFIL}, profiles(id, nome, tag, foto)`;

export function EventoItens({
  eventoId,
  usuarioId,
  podeGerenciar = false,
}: {
  eventoId: string;
  usuarioId: string;
  podeGerenciar?: boolean;
}) {
  const [itens, setItens] = useState<EventoItem[]>([]);
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    createClient()
      .from("evento_itens")
      .select(CAMPOS)
      .eq("evento_id", eventoId)
      .order("criado_em")
      .then(({ data }) => {
        if (ativo) setItens((data ?? []) as unknown as EventoItem[]);
      });
    return () => { ativo = false; };
  }, [eventoId]);

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setErro("");
    setSalvando(true);
    const { data, error } = await createClient().from("evento_itens").insert({
      evento_id: eventoId,
      usuario_id: null,
      sugerido_por: usuarioId,
      nome: nome.trim(),
      quantidade: quantidade.trim() || null,
    }).select(CAMPOS_SEM_PERFIL).single();
    setSalvando(false);
    if (error || !data) {
      setErro(error?.message ?? "Não foi possível adicionar o item.");
      return;
    }
    setItens((lista) => [...lista, data as EventoItem]);
    setNome("");
    setQuantidade("");
  }

  async function assumir(item: EventoItem) {
    const { data, error } = await createClient()
      .from("evento_itens")
      .update({ usuario_id: usuarioId })
      .eq("id", item.id)
      .select(CAMPOS_SEM_PERFIL)
      .single();
    if (error || !data) {
      setErro(error?.message ?? "Não foi possível assumir o item.");
      return;
    }
    setItens((lista) => lista.map((atual) => (atual.id === item.id ? { ...atual, ...data } : atual)));
  }

  async function remover(item: EventoItem) {
    const { error } = await createClient().from("evento_itens").delete().eq("id", item.id);
    if (error) {
      setErro(error.message);
      return;
    }
    setItens((lista) => lista.filter((atual) => atual.id !== item.id));
  }

  const assumidos = itens.filter((item) => item.usuario_id).length;

  return (
    <div className="mt-3 border-t border-line pt-3">
      <button
        type="button"
        onClick={() => setAberto((valor) => !valor)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        aria-expanded={aberto}
      >
        <ClipboardList size={14} /> Quem traz o quê ({assumidos}/{itens.length})
      </button>

      {aberto && (
        <div className="mt-3 space-y-3 rounded-xl bg-soft/40 p-3">
          {itens.length === 0 && (
            <p className="text-xs text-muted">Ninguém sugeriu nada ainda. Comece a lista!</p>
          )}
          <ul className="space-y-2">
            {itens.map((item) => {
              const meu = item.usuario_id === usuarioId;
              const dono = item.usuario_id ? (item.profiles ?? { nome: "Membro" }) : null;
              const minhaSugestao = item.sugerido_por === usuarioId;
              const podeExcluir = meu || minhaSugestao || podeGerenciar;
              return (
                <li key={item.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <Check size={14} className={dono ? "shrink-0 text-success" : "shrink-0 text-muted"} />
                  <span className="min-w-0 flex-1 truncate text-ink" title={item.nome}>
                    {item.nome}{item.quantidade ? ` · ${item.quantidade}` : ""}
                  </span>
                  {dono ? (
                    <span className="text-xs font-semibold text-muted">{meu ? "Você" : dono.nome}</span>
                  ) : (
                    <>
                      {minhaSugestao && <span className="text-[10px] text-muted">sua sugestão</span>}
                      <button type="button" onClick={() => assumir(item)} className="text-xs font-semibold text-primary hover:underline">Eu levo</button>
                    </>
                  )}
                  {podeExcluir && (
                    <button type="button" onClick={() => remover(item)} aria-label={`Remover ${item.nome}`} className="rounded p-1 text-muted hover:text-danger">
                      <Trash2 size={13} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          <form onSubmit={adicionar} className="flex flex-wrap gap-2">
            <input className="input min-w-0 flex-1 py-1.5 text-xs" placeholder="Ex: Carvão, refrigerante..." value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} />
            <input className="input w-24 py-1.5 text-xs" placeholder="Qtd." value={quantidade} onChange={(e) => setQuantidade(e.target.value)} maxLength={20} />
            <button type="submit" disabled={salvando || !nome.trim()} className="btn-secondary px-2.5 py-1.5 text-xs"><Plus size={14} /> Adicionar</button>
          </form>
          <p className="flex items-start gap-1 text-[11px] text-muted">
            <Info size={12} className="mt-0.5 shrink-0" />
            {itens.length ? `Última atualização: ${formatarDataHora(itens[itens.length - 1].criado_em)}.` : "Seus itens ficam salvos para todo o grupo."}
          </p>
          {erro && <p className="text-xs text-danger">{erro}</p>}
        </div>
      )}
    </div>
  );
}
