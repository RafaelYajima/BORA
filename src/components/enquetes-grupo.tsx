"use client";

import { useEffect, useState } from "react";
import { BarChart3, Check, Clock, Lock, Plus, Trash2, Vote, X } from "lucide-react";
import { Erro } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { Enquete } from "@/lib/types";

const CAMPOS = "id, grupo_id, criador_id, titulo, descricao, encerrada, encerra_em, criado_em, enquete_opcoes(id, enquete_id, data_hora, enquete_votos(id, usuario_id))";

function formatarOpcao(dataHora: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(new Date(dataHora));
}

export function EnquetesGrupo({
  grupoId,
  usuarioId,
  isAdmin,
}: {
  grupoId: string;
  usuarioId: string;
  isAdmin: boolean;
}) {
  const [enquetes, setEnquetes] = useState<Enquete[]>([]);
  const [criando, setCriando] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prazo, setPrazo] = useState("");
  const [opcoes, setOpcoes] = useState(["", ""]);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    const { data } = await createClient()
      .from("enquetes")
      .select(CAMPOS)
      .eq("grupo_id", grupoId)
      .order("criado_em", { ascending: false });
    setEnquetes((data ?? []) as unknown as Enquete[]);
  }

  useEffect(() => {
    let ativo = true;
    createClient()
      .from("enquetes")
      .select(CAMPOS)
      .eq("grupo_id", grupoId)
      .order("criado_em", { ascending: false })
      .then(({ data }) => {
        if (ativo) setEnquetes((data ?? []) as unknown as Enquete[]);
      });
    return () => { ativo = false; };
  }, [grupoId]);

  function redefinirFormulario() {
    setTitulo("");
    setDescricao("");
    setPrazo("");
    setOpcoes(["", ""]);
    setCriando(false);
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    const datas = opcoes.map((valor) => valor.trim()).filter(Boolean);
    if (!titulo.trim()) {
      setErro("Informe um título para a enquete.");
      return;
    }
    if (datas.length < 2) {
      setErro("Informe pelo menos duas datas/horários.");
      return;
    }
    if (datas.some((valor) => Number.isNaN(new Date(valor).getTime()) || new Date(valor).getTime() <= Date.now())) {
      setErro("Escolha datas e horários futuros.");
      return;
    }
    if (prazo && (Number.isNaN(new Date(prazo).getTime()) || new Date(prazo).getTime() <= Date.now())) {
      setErro("O prazo da enquete deve estar no futuro.");
      return;
    }

    setErro("");
    setSalvando(true);
    const supabase = createClient();
    const id = crypto.randomUUID();
    const { error: erroEnquete } = await supabase.from("enquetes").insert({
      id,
      grupo_id: grupoId,
      criador_id: usuarioId,
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      encerra_em: prazo ? new Date(prazo).toISOString() : null,
    });
    if (erroEnquete) {
      setErro(erroEnquete.message);
      setSalvando(false);
      return;
    }
    const { error: erroOpcoes } = await supabase.from("enquete_opcoes").insert(
      datas.map((valor) => ({ enquete_id: id, data_hora: new Date(valor).toISOString() })),
    );
    if (erroOpcoes) {
      await supabase.from("enquetes").delete().eq("id", id);
      setErro(erroOpcoes.message);
      setSalvando(false);
      return;
    }
    redefinirFormulario();
    setSalvando(false);
    await carregar();
  }

  async function votar(enqueteId: string, opcaoId: string) {
    setErro("");
    const supabase = createClient();
    const { data: anterior } = await supabase
      .from("enquete_votos")
      .select("id")
      .eq("enquete_id", enqueteId)
      .eq("usuario_id", usuarioId)
      .maybeSingle();
    const resultado = anterior
      ? await supabase.from("enquete_votos").update({ opcao_id: opcaoId }).eq("id", anterior.id)
      : await supabase.from("enquete_votos").insert({
        enquete_id: enqueteId,
        opcao_id: opcaoId,
        usuario_id: usuarioId,
      });
    if (resultado.error) {
      setErro(resultado.error.message);
      return;
    }
    await carregar();
  }

  async function encerrar(enqueteId: string) {
    const { error } = await createClient().from("enquetes").update({ encerrada: true }).eq("id", enqueteId);
    if (error) setErro(error.message);
    else await carregar();
  }

  async function excluir(enqueteId: string) {
    if (!window.confirm("Excluir esta enquete e todos os votos?")) return;
    const { error } = await createClient().from("enquetes").delete().eq("id", enqueteId);
    if (error) setErro(error.message);
    else await carregar();
  }

  return (
    <section className="card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="section-title">Enquetes de encontro</h3>
          <p className="mt-1 text-xs text-muted">Descubra qual dia e horário funcionam para todo mundo.</p>
        </div>
        <button
          type="button"
          onClick={() => (criando ? redefinirFormulario() : setCriando(true))}
          className="btn-secondary px-3 py-1.5 text-xs"
        >
          {criando ? <X size={14} /> : <Plus size={14} />} {criando ? "Cancelar" : "Nova enquete"}
        </button>
      </div>

      {criando && (
        <form onSubmit={criar} className="mb-5 space-y-3 rounded-xl bg-soft/40 p-4">
          <div>
            <label className="label" htmlFor="titulo-enquete">Título</label>
            <input id="titulo-enquete" className="input" placeholder="Ex: Qual dia para o churrasco?" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={120} />
          </div>
          <div>
            <label className="label" htmlFor="descricao-enquete">Descrição (opcional)</label>
            <input id="descricao-enquete" className="input" placeholder="Alguma informação extra" value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={200} />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="label mb-0">Datas e horários (mínimo 2, máximo 5)</p>
              {opcoes.length < 5 && (
                <button type="button" onClick={() => setOpcoes((lista) => [...lista, ""])} className="text-xs font-semibold text-primary hover:underline">
                  + Adicionar opção
                </button>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {opcoes.map((valor, indice) => (
                <div key={indice} className="flex items-center gap-1">
                  <input
                    type="datetime-local"
                    aria-label={`Opção ${indice + 1}`}
                    className="input min-w-0 flex-1 text-xs"
                    value={valor}
                    onChange={(e) => setOpcoes((lista) => lista.map((item, i) => (i === indice ? e.target.value : item)))}
                  />
                  {opcoes.length > 2 && (
                    <button
                      type="button"
                      aria-label={`Remover opção ${indice + 1}`}
                      onClick={() => setOpcoes((lista) => lista.filter((_, i) => i !== indice))}
                      className="rounded-lg p-2 text-muted hover:text-danger"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="label" htmlFor="prazo-enquete">Prazo para votar (opcional)</label>
            <input
              id="prazo-enquete"
              type="datetime-local"
              className="input text-xs"
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-muted">Ao vencer, a enquete é encerrada automaticamente e mostra a opção mais votada.</p>
          </div>
          <button type="submit" disabled={salvando} className="btn-primary px-3 py-1.5 text-xs">
            {salvando ? "Criando..." : "Criar enquete"}
          </button>
        </form>
      )}

      {enquetes.length === 0 && !criando && (
        <p className="text-sm text-muted">Nenhuma enquete por aqui. Crie uma para decidir o próximo encontro.</p>
      )}

      <div className="space-y-5">
        {enquetes.map((enquete) => {
          const opcoesDaEnquete = [...(enquete.enquete_opcoes ?? [])].sort((a, b) => a.data_hora.localeCompare(b.data_hora));
          const totalVotos = opcoesDaEnquete.reduce((soma, opcao) => soma + (opcao.enquete_votos?.length ?? 0), 0);
          const maisVotados = Math.max(0, ...opcoesDaEnquete.map((opcao) => opcao.enquete_votos?.length ?? 0));
          const meuVoto = opcoesDaEnquete.find((opcao) => opcao.enquete_votos?.some((voto) => voto.usuario_id === usuarioId));
          const podeGerenciar = enquete.criador_id === usuarioId || isAdmin;

          return (
            <article key={enquete.id} className="rounded-xl border border-line p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-display font-bold text-ink">{enquete.titulo}</h4>
                  {enquete.descricao && <p className="text-xs text-muted">{enquete.descricao}</p>}
                  <p className="mt-1 text-xs text-muted">
                    <BarChart3 size={12} className="inline" /> {totalVotos} voto{totalVotos === 1 ? "" : "s"}
                    {enquete.encerra_em && !enquete.encerrada && (
                      <> · <Clock size={12} className="inline" /> encerra {formatarOpcao(enquete.encerra_em)}</>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {enquete.encerrada && <span className="chip bg-soft text-muted"><Lock size={11} /> Encerrada</span>}
                  {podeGerenciar && (
                    <>
                      {!enquete.encerrada && (
                        <button type="button" onClick={() => encerrar(enquete.id)} className="text-xs font-semibold text-primary hover:underline">Encerrar</button>
                      )}
                      <button type="button" onClick={() => excluir(enquete.id)} aria-label="Excluir enquete" className="rounded-lg p-1.5 text-muted hover:bg-danger/10 hover:text-danger">
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {opcoesDaEnquete.map((opcao) => {
                  const votos = opcao.enquete_votos?.length ?? 0;
                  const meu = meuVoto?.id === opcao.id;
                  const vencedora = enquete.encerrada && votos === maisVotados && votos > 0;
                  const largura = totalVotos ? Math.round((votos / totalVotos) * 100) : 0;
                  return (
                    <div key={opcao.id} className="rounded-lg border border-line p-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="font-semibold text-ink">{vencedora ? "🏆 " : ""}{formatarOpcao(opcao.data_hora)}</span>
                        <button
                          type="button"
                          disabled={enquete.encerrada || meu}
                          onClick={() => votar(enquete.id, opcao.id)}
                          className={`text-xs font-semibold ${enquete.encerrada ? "text-muted" : "text-primary hover:underline"} disabled:opacity-60`}
                        >
                          {meu ? <><Check size={12} className="inline" /> Seu voto</> : <><Vote size={12} className="inline" /> Votar</>} · {votos}
                        </button>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-soft">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${largura}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
      {erro && <div className="mt-3"><Erro mensagem={erro} /></div>}
    </section>
  );
}
