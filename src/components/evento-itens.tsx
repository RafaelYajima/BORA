"use client";

import { useEffect, useState } from "react";
import { Check, ClipboardList, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { EventoItem } from "@/lib/types";

export function EventoItens({ eventoId, usuarioId }: { eventoId: string; usuarioId: string }) {
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
      .select("id, evento_id, usuario_id, nome, quantidade, criado_em, profiles(id, nome, tag, foto)")
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
      nome: nome.trim(),
      quantidade: quantidade.trim() || null,
    }).select("id, evento_id, usuario_id, nome, quantidade, criado_em").single();
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
      .select("id, evento_id, usuario_id, nome, quantidade, criado_em")
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

  return (
    <div className="mt-3 border-t border-line pt-3">
      <button
        type="button"
        onClick={() => setAberto((valor) => !valor)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        aria-expanded={aberto}
      >
        <ClipboardList size={14} /> Quem traz o quê ({itens.length})
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
              return (
                <li key={item.id} className="flex items-center gap-2 text-sm">
                  <Check size={14} className={dono ? "text-success" : "text-muted"} />
                  <span className="min-w-0 flex-1 truncate text-ink">
                    {item.nome}{item.quantidade ? ` · ${item.quantidade}` : ""}
                  </span>
                  {dono ? (
                    <span className="text-xs font-semibold text-muted">{meu ? "Você" : dono.nome}</span>
                  ) : (
                    <button type="button" onClick={() => assumir(item)} className="text-xs font-semibold text-primary hover:underline">Eu levo</button>
                  )}
                  {(meu || !dono) && (
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
          {erro && <p className="text-xs text-danger">{erro}</p>}
        </div>
      )}
    </div>
  );
}
