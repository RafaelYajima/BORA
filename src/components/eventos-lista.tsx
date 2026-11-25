"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarClock, Check, Pencil, Trash2, Users, X } from "lucide-react";
import { EnderecoResumo } from "@/components/endereco-resumo";
import { CheckinEvento } from "@/components/checkin-evento";
import { EventoAcoes } from "@/components/evento-acoes";
import { EventoItens } from "@/components/evento-itens";
import { MapaModal } from "@/components/mapa";
import { EmptyState, Erro } from "@/components/ui";
import { formatarData, formatarHora } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { EventoComGrupo, Presenca } from "@/lib/types";

const MESES_CURTOS = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

export function ListaEventos({
  eventos,
  usuarioId,
  mostrarGrupo = false,
  podeGerenciar = false,
  mensagemVazia = "Nenhum evento por aqui ainda.",
}: {
  eventos: EventoComGrupo[];
  usuarioId: string;
  mostrarGrupo?: boolean;
  podeGerenciar?: boolean;
  mensagemVazia?: string;
}) {
  const [itens, setItens] = useState(eventos);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState<string | null>(null);
  const [mapa, setMapa] = useState<EventoComGrupo | null>(null);

  async function responder(evento: EventoComGrupo, status: "vou" | "nao_vou") {
    setErro("");
    setSalvando(evento.id);
    const supabase = createClient();
    const anterior = evento.presencas?.find((p) => p.usuario_id === usuarioId);
    const { data, error } = anterior
      ? await supabase
          .from("presencas")
          .update({ status, respondido_em: new Date().toISOString() })
          .eq("id", anterior.id)
          .select()
          .single()
      : await supabase
          .from("presencas")
          .insert({ evento_id: evento.id, usuario_id: usuarioId, status })
          .select()
          .single();

    setSalvando(null);
    if (error || !data) {
      setErro(error?.message ?? "Não foi possível salvar sua resposta.");
      return;
    }
    const resposta = data as Presenca;
    setItens((lista) =>
      lista.map((item) =>
        item.id === evento.id
          ? {
              ...item,
              presencas: [
                ...(item.presencas ?? []).filter((p) => p.usuario_id !== usuarioId),
                resposta,
              ],
            }
          : item,
      ),
    );
  }

  async function excluir(id: string) {
    if (!window.confirm("Excluir este evento? Essa ação não pode ser desfeita.")) return;
    const { error } = await createClient().from("eventos").delete().eq("id", id);
    if (error) {
      setErro(error.message);
      return;
    }
    setItens((lista) => lista.filter((item) => item.id !== id));
  }

  if (!itens.length) return <EmptyState titulo={mensagemVazia} icone={<CalendarClock size={26} />} />;

  return (
    <div className="space-y-3">
      {erro && <Erro mensagem={erro} />}
      {itens.map((evento) => {
        const [, mes, dia] = evento.data_evento.split("-");
        const vou = evento.presencas?.filter((p) => p.status === "vou").length ?? 0;
        const naoVou = evento.presencas?.filter((p) => p.status === "nao_vou").length ?? 0;
        const minha = evento.presencas?.find((p) => p.usuario_id === usuarioId);
        const temMapa = evento.latitude != null && evento.longitude != null;
        const organizador = podeGerenciar || evento.criador_id === usuarioId;

        return (
          <article key={evento.id} className="card animate-in p-4 sm:p-5">
            <div className="flex gap-4">
              <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <span className="font-display text-2xl font-extrabold leading-none">{dia}</span>
                <span className="text-[10px] font-bold tracking-wider">{MESES_CURTOS[Number(mes) - 1]}</span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-lg font-bold text-ink">{evento.nome}</h3>
                    <p className="text-xs font-medium text-muted">{formatarData(evento.data_evento)} · {formatarHora(evento.hora_evento)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {mostrarGrupo && evento.grupos && (
                      <Link href={`/grupos/${evento.grupos.id}`} className="chip bg-soft text-muted hover:text-primary">
                        <Users size={12} /> {evento.grupos.nome}
                      </Link>
                    )}
                    {podeGerenciar && (
                      <>
                        <Link href={`/grupos/${evento.grupo_id}/eventos/${evento.id}/editar`} aria-label="Editar evento" className="rounded-lg p-1.5 text-muted hover:bg-soft hover:text-primary">
                          <Pencil size={15} />
                        </Link>
                        <button onClick={() => excluir(evento.id)} aria-label="Excluir evento" className="rounded-lg p-1.5 text-muted hover:bg-danger/10 hover:text-danger">
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {evento.descricao && <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{evento.descricao}</p>}

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
                  {evento.local_evento && (
                    <EnderecoResumo texto={evento.local_evento} />
                  )}
                  {temMapa && (
                    <button onClick={() => setMapa(evento)} className="font-semibold text-primary hover:underline">Ver no mapa</button>
                  )}
                  <span className="inline-flex items-center gap-1"><Check size={14} className="text-success" /> {vou} confirmado{vou === 1 ? "" : "s"}</span>
                  {naoVou > 0 && <span className="inline-flex items-center gap-1"><X size={14} className="text-danger" /> {naoVou} recusou{naoVou === 1 ? "" : "s"}</span>}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    disabled={salvando === evento.id}
                    onClick={() => responder(evento, "vou")}
                    className={`btn px-3 py-2 text-xs ${minha?.status === "vou" ? "bg-success text-white" : "border border-success/40 text-success hover:bg-success/10"}`}
                  >
                    <Check size={15} /> {minha?.status === "vou" ? "Você vai!" : "Vou!"}
                  </button>
                  <button
                    disabled={salvando === evento.id}
                    onClick={() => responder(evento, "nao_vou")}
                    className={`btn px-3 py-2 text-xs ${minha?.status === "nao_vou" ? "bg-danger text-white" : "border border-danger/40 text-danger hover:bg-danger/10"}`}
                  >
                    <X size={15} /> {minha?.status === "nao_vou" ? "Você não vai" : "Não vou"}
                  </button>
                </div>

                <EventoAcoes evento={evento} grupo={evento.grupos} />
                <EventoItens eventoId={evento.id} usuarioId={usuarioId} />
                <CheckinEvento eventoId={evento.id} organizador={organizador} />
              </div>
            </div>
          </article>
        );
      })}
      {mapa && (
        <MapaModal
          titulo={mapa.nome}
          latitude={mapa.latitude!}
          longitude={mapa.longitude!}
          onFechar={() => setMapa(null)}
        />
      )}
    </div>
  );
}
